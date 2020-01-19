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
    applySimpleOperation, applyExponentOperation, applyProductOperation, maxDegree, sumDegree,
} from "./operations";
import { getExponentValue } from "./utils";

// INTERFACES
// ================================================================================================
interface AnalysisContext {
    info: {
        const   : ExpressionInfo[];
        param   : ExpressionInfo[];
        local   : ExpressionInfo[];
        static  : Dimensions;
        trace   : Dimensions;
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
        const lhsInfo = this.visit(e.lhs, ctx);
        const rhsInfo = this.visit(e.rhs, ctx);
        switch(e.operation) {
            case 'add': case 'sub': {
                ctx.stats.add += getSimpleOperationCount(e.lhs);
                return applySimpleOperation(maxDegree, lhsInfo, rhsInfo);
            }
            case 'mul': {
                ctx.stats.mul += getSimpleOperationCount(e.lhs);
                return applySimpleOperation(sumDegree, lhsInfo, rhsInfo);
            }
            case 'div': {
                ctx.stats.mul += getSimpleOperationCount(e.lhs);
                ctx.stats.inv += 1;
                return applySimpleOperation(sumDegree, lhsInfo, rhsInfo); // TODO: incorrect degree
            }
            case 'exp': {
                const exponent = getExponentValue(e.rhs);
                ctx.stats.mul += getExponentOperationCount(e.lhs, exponent);
                return applyExponentOperation(lhsInfo, exponent);
            }
            case 'prod': {
                const counts = getProductOperationCounts(e.lhs, e.rhs);
                ctx.stats.mul += counts.mul;
                ctx.stats.add += counts.add;
                return applyProductOperation(lhsInfo, rhsInfo);
            }
        }
    }

    unaryOperation(e: UnaryOperation, ctx: AnalysisContext): ExpressionInfo {
        const operandInfo = this.visit(e.operand, ctx);
        switch (e.operation) {
            case 'neg': {
                ctx.stats.add += getSimpleOperationCount(e.operand);
                return operandInfo;
            }
            case 'inv': {
                ctx.stats.inv += getSimpleOperationCount(e.operand);
                return operandInfo; // TODO: incorrect degree
            }
        }
    }

    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    makeVector(e: MakeVector, ctx: AnalysisContext): ExpressionInfo {
        let result: InfoItem[] = [];
        for (let element of e.elements) {
            const elementInfo = this.visit(element, ctx);
            if (element.isScalar) {
                result.push(elementInfo as InfoItem);
            }
            else if (element.isVector) {
                result = result.concat(elementInfo as InfoItem[]);
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
                else if (element.isVector) {
                    rowInfo = rowInfo.concat(elementInfo as InfoItem[])
                }
            }
            result.push(rowInfo);
        }
        return result;
    }

    // LOAD AND STORE
    // --------------------------------------------------------------------------------------------
    loadExpression(e: LoadExpression, ctx: AnalysisContext): ExpressionInfo {
        switch (e.source) {
            case 'const':  return ctx.info.const[e.index];
            case 'param':  return ctx.info.param[e.index];
            case 'local':  return ctx.info.local[e.index];
            case 'trace':  return dimensionsToInfo(ctx.info.trace, 1n, new Set([e.index]), new Set());
            case 'static': return dimensionsToInfo(ctx.info.static, 1n, new Set(), new Set([e.index]));
        }
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
            fnContext.info.param[i] = this.visit(p, ctx);
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
            const   : procedure.constants.map(c => dimensionsToInfo(c.dimensions)),
            param   : [],
            local   : new Array(procedure.locals.length),
            static  : procedure.staticRegisters.dimensions,
            trace   : procedure.traceRegisters.dimensions
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
function dimensionsToInfo(dimensions: Dimensions, degree = 0n, traceRefs = new Set<number>(), staticRefs = new Set<number>()): ExpressionInfo {
    if (Dimensions.isScalar(dimensions)) {
        return { degree, staticRefs, traceRefs };
    }
    else if (Dimensions.isVector(dimensions)) {
        return new Array(dimensions[0]).fill({ degree, staticRefs, traceRefs });
    }
    else {
        return new Array(dimensions[0]).fill(new Array(dimensions[1]).fill({ degree, staticRefs, traceRefs }));
    }
}