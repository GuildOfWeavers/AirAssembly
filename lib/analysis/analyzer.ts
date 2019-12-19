// IMPORTS
// ================================================================================================
import { ProcedureAnalysisResult } from "@guildofweavers/air-assembly";
import { AirProcedure } from "../procedures";
import {
    ExpressionVisitor, LiteralValue, BinaryOperation, UnaryOperation, MakeVector,
    GetVectorElement, SliceVector, MakeMatrix, LoadExpression, Dimensions, CallExpression
} from "../expressions";
import {
    OperationStats, getSimpleOperationCount, getExponentOperationCount, getProductOperationCounts,
    applySimpleOperation, applyExponent, applyProductOperation, maxDegree, sumDegree,
} from "./operations";
import { getExponentValue } from "./utils";

// INTERFACES
// ================================================================================================
interface AnalysisContext {
    info: {
        const   : ExpressionInfo[];
        param   : ExpressionInfo[];
        local   : ExpressionInfo[];
        static  : number;
        trace   : number;
    }
    stats       : OperationStats;
}

export interface InfoItem {
    readonly degree     : bigint;
    readonly traceRefs  : Set<number>
    readonly staticRefs : Set<number>
}

export type ExpressionInfo = InfoItem | InfoItem[] | InfoItem[][];

// EXPRESSION ANALYZER CLASS
// ================================================================================================
class ExpressionAnalyzer extends ExpressionVisitor<ExpressionInfo> {

    // LITERALS
    // --------------------------------------------------------------------------------------------
    literalValue(e: LiteralValue): ExpressionInfo {
        return dimensionsToInfo(e.dimensions, 0n);
    }

    // OPERATIONS
    // --------------------------------------------------------------------------------------------
    binaryOperation(e: BinaryOperation, ctx: AnalysisContext): ExpressionInfo {
        
        let result: ExpressionInfo;
        const lhsInfo = this.visit(e.lhs, ctx);
        const rhsInfo = this.visit(e.rhs, ctx);

        switch(e.operation) {
            case 'add': case 'sub': {
                ctx.stats.add += getSimpleOperationCount(e.lhs);
                result = applySimpleOperation(maxDegree, lhsInfo, rhsInfo);
                break;
            }
            case 'mul': {
                ctx.stats.mul += getSimpleOperationCount(e.lhs);
                result = applySimpleOperation(sumDegree, lhsInfo, rhsInfo);
                break;
            }
            case 'div': {
                ctx.stats.mul += getSimpleOperationCount(e.lhs);
                ctx.stats.inv += 1;
                result = applySimpleOperation(sumDegree, lhsInfo, rhsInfo); // TODO: incorrect degree
                break;
            }
            case 'exp': {
                const exponent = getExponentValue(e.rhs);
                ctx.stats.mul += getExponentOperationCount(e.lhs, exponent);
                result = applyExponent(lhsInfo, exponent);
                break;
            }
            case 'prod': {
                const counts = getProductOperationCounts(e.lhs, e.rhs);
                ctx.stats.mul += counts.mul;
                ctx.stats.add += counts.add;
                result = applyProductOperation(lhsInfo, rhsInfo);
                break;
            }
        }

        return result;
    }

    unaryOperation(e: UnaryOperation, ctx: AnalysisContext): ExpressionInfo {
        const operandInfo = this.visit(e.operand, ctx);
        if (e.operation === 'neg') {
            ctx.stats.add += getSimpleOperationCount(e.operand);
            return operandInfo;
        }
        else if (e.operation === 'inv') {
            ctx.stats.inv += getSimpleOperationCount(e.operand);
            return operandInfo; // TODO: incorrect degree
        }
        else {
            throw new Error(`unary operation '${e.operation}' is invalid`);
        }
    }

    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    makeVector(e: MakeVector, ctx: AnalysisContext): ExpressionInfo {
        let result: InfoItem[] = [];
        for (let element of e.elements) {
            const elementItem = this.visit(element, ctx);
            if (element.isScalar) {
                result.push(elementItem as InfoItem);
            }
            else if (element.isVector) {
                result = result.concat(elementItem as InfoItem[]);
            }
        }
        return result;
    }

    getVectorElement(e: GetVectorElement, ctx: AnalysisContext): ExpressionInfo {
        const sourceItems = this.visit(e.source, ctx) as InfoItem[];
        return sourceItems[e.index];
    }

    sliceVector(e: SliceVector, ctx: AnalysisContext): ExpressionInfo {
        const sourceItems = this.visit(e.source, ctx) as InfoItem[];
        return sourceItems.slice(e.start, e.end + 1);
    }

    makeMatrix(e: MakeMatrix, ctx: AnalysisContext): ExpressionInfo {
        const result: InfoItem[][] = [];
        for (let row of e.elements) {
            let rowInfo: InfoItem[] = [];
            for (let element of row) {
                const elementInfo = this.visit(element, ctx);
                if (element.isScalar) {
                    rowInfo.push(elementInfo as InfoItem);
                }
                else {
                    // TODO?
                }
            }
            result.push(rowInfo);
        }
        return result;
    }

    // LOAD AND STORE
    // --------------------------------------------------------------------------------------------
    loadExpression(e: LoadExpression, ctx: AnalysisContext): ExpressionInfo {
        if (e.source === 'const')       return ctx.info.const[e.index];
        else if (e.source === 'param')  return ctx.info.param[e.index];
        else if (e.source === 'local')  return ctx.info.local[e.index];
        else if (e.source === 'static') {
            const result: InfoItem[] = [];
            const info = { degree: 1n, staticRefs: new Set([e.index]), traceRefs: new Set<number>() };
            for (let i = 0; i < ctx.info.static; i++) { result.push(info); }
            return result;
        }
        else if (e.source === 'trace') {
            const result: InfoItem[] = [];
            const info = { degree: 1n, staticRefs: new Set<number>(), traceRefs: new Set([e.index]) };
            for (let i = 0; i < ctx.info.trace; i++) { result.push(info); }
            return result;
        }
        else throw new Error(`load source '${e.source}' is invalid`);
    }

    // CALL EXPRESSION
    // --------------------------------------------------------------------------------------------
    callExpression(e: CallExpression, ctx: AnalysisContext): ExpressionInfo {
        const fnContext: AnalysisContext = {
            info  : { ...ctx.info, param: [], local: [] },
            stats   : ctx.stats
        };

        // analyze parameters
        e.params.forEach((p, i) => {
            fnContext.info.param[i] = this.visit(p, fnContext);
        });

        // analyze statements
        e.func.statements.forEach(s => {
            fnContext.info.local[s.target] = this.visit(s.expression, fnContext);
        });

        return this.visit(e.func.result, fnContext);
    }
}

// PUBLIC FUNCTIONS
// ================================================================================================
const analyzer = new ExpressionAnalyzer();
export function analyzeProcedure(procedure: AirProcedure): ProcedureAnalysisResult {

    // initialize context
    const context: AnalysisContext = {
        info: {
            const   : procedure.constants.map(c => dimensionsToInfo(c.dimensions, 0n)),
            param   : [],
            local   : new Array(procedure.locals.length),
            static  : procedure.staticRegisters.dimensions[0],
            trace   : procedure.traceRegisters.dimensions[0]
        },
        stats: { add: 0, mul: 0, inv: 0 }
    }

    // analyze statements
    procedure.statements.forEach(s => {
        context.info.local[s.target] = analyzer.visit(s.expression, context);
    });

    // analyze result and return
    const procedureInfo = analyzer.visit(procedure.result, context);
    const results = (procedureInfo as InfoItem[]).map(item => ({
        degree      : item.degree,
        traceRefs   : Array.from(item.traceRefs).sort((a, b) => a - b),
        staticRefs  : Array.from(item.staticRefs).sort((a, b) => a - b)
    }));
    return { results, operations: context.stats };
}

// HELPER FUNCTIONS
// ================================================================================================
function dimensionsToInfo(dimensions: Dimensions, degree: bigint): ExpressionInfo {
    if (Dimensions.isScalar(dimensions)) {
        return { degree, staticRefs: new Set(), traceRefs: new Set() };
    }
    else if (Dimensions.isVector(dimensions)) {
        const info = { degree, staticRefs: new Set(), traceRefs: new Set() };
        return new Array(dimensions[0]).fill(info);
    }
    else {
        const info = { degree, staticRefs: new Set(), traceRefs: new Set() };
        return new Array(dimensions[0]).fill(new Array(dimensions[1]).fill(info));
    }
}