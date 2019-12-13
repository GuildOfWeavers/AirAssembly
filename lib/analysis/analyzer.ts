// IMPORTS
// ================================================================================================
import { Degree, ProcedureAnalysisResult } from "@guildofweavers/air-assembly";
import { AirProcedure } from "../procedures";
import {
    ExpressionVisitor, LiteralValue, BinaryOperation, UnaryOperation, MakeVector,
    GetVectorElement, SliceVector, MakeMatrix, LoadExpression, Dimensions, CallExpression
} from "../expressions";
import { getBinaryOperationDegree, getUnaryOperationDegree } from "./degree";
import { analyzeBinaryOperation, analyzeUnaryOperation, OperationStats } from "./operations";

// INTERFACES
// ================================================================================================
interface AnalysisContext {
    degree: {
        const   : Degree[];
        param   : Degree[];
        local   : Degree[];
        static  : Degree;
        trace   : Degree;
    }
    stats       : OperationStats;
}

// EXPRESSION ANALYZER CLASS
// ================================================================================================
class ExpressionAnalyzer extends ExpressionVisitor<Degree> {

    // LITERALS
    // --------------------------------------------------------------------------------------------
    literalValue(e: LiteralValue): Degree {
        return dimensionsToDegree(e.dimensions, 0n);
    }

    // OPERATIONS
    // --------------------------------------------------------------------------------------------
    binaryOperation(e: BinaryOperation, ctx: AnalysisContext): Degree {
        analyzeBinaryOperation(e, ctx.stats);
        const lhsDegree = this.visit(e.lhs, ctx);
        const rhsDegree = this.visit(e.rhs, ctx);
        const degree = getBinaryOperationDegree(e, lhsDegree, rhsDegree);
        return degree;
    }

    unaryOperation(e: UnaryOperation, ctx: AnalysisContext): Degree {
        analyzeUnaryOperation(e, ctx.stats);
        const opDegree = this.visit(e, ctx);
        const degree = getUnaryOperationDegree(e, opDegree);
        return degree;
    }

    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    makeVector(e: MakeVector, ctx: AnalysisContext): Degree {
        let degree: bigint[] = [];
        for (let element of e.elements) {
            const elementDegree = this.visit(element, ctx);
            if (element.isScalar) {
                degree.push(elementDegree as bigint);
            }
            else if (element.isVector) {
                degree = degree.concat(elementDegree as bigint[]);
            }
        }
        return degree;
    }

    getVectorElement(e: GetVectorElement, ctx: AnalysisContext): Degree {
        const sourceDegree = this.visit(e.source, ctx) as bigint[];
        return sourceDegree[e.index];
    }

    sliceVector(e: SliceVector, ctx: AnalysisContext): Degree {
        const sourceDegree = this.visit(e.source, ctx) as bigint[];
        return sourceDegree.slice(e.start, e.end + 1);
    }

    makeMatrix(e: MakeMatrix, ctx: AnalysisContext): Degree {
        const degree: bigint[][] = [];
        for (let row of e.elements) {
            let rowDegree: bigint[] = [];
            for (let element of row) {
                const elementDegree = this.visit(element, ctx);
                if (element.isScalar) {
                    rowDegree.push(elementDegree as bigint);
                }
            }
            degree.push(rowDegree);
        }
        return degree;
    }

    // LOAD AND STORE
    // --------------------------------------------------------------------------------------------
    loadExpression(e: LoadExpression, ctx: AnalysisContext): Degree {
        if (e.source === 'const') return ctx.degree.const[e.index];
        else if (e.source === 'param') return ctx.degree.param[e.index];
        else if (e.source === 'local') return ctx.degree.local[e.index];
        else if (e.source === 'static') return ctx.degree.static;
        else return ctx.degree.trace;
    }

    // CALL EXPRESSION
    // --------------------------------------------------------------------------------------------
    callExpression(e: CallExpression, ctx: AnalysisContext): Degree {
        const fnContext: AnalysisContext = {
            degree  : { ...ctx.degree, param: [], local: [] },
            stats   : ctx.stats
        };

        // analyze parameters
        e.parameters.forEach((p, i) => {
            const degree = this.visit(p, fnContext);
            fnContext.degree.param[i] = degree;
        });

        // analyze statements
        e.func.statements.forEach(s => {
            const degree = this.visit(s.expression, fnContext);
            fnContext.degree.local[s.target] = degree;
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
        degree: {
            const   : procedure.constants.map(c => dimensionsToDegree(c.dimensions, 0n)),
            param   : [],
            local   : new Array(procedure.locals.length),
            static  : dimensionsToDegree(procedure.staticRegisters.dimensions, 1n),
            trace   : dimensionsToDegree(procedure.traceRegisters.dimensions, 1n)
        },
        stats: { add: 0, mul: 0, inv: 0 }
    }

    // analyze statements
    procedure.statements.forEach(s => {
        const degree = analyzer.visit(s.expression, context);
        context.degree.local[s.target] = degree;
    });

    // analyze result and return
    const degree = analyzer.visit(procedure.result, context) as bigint[];
    return { degree, operations: context.stats };
}

// HELPER FUNCTIONS
// ================================================================================================
function dimensionsToDegree(dimensions: Dimensions, degree: bigint): Degree {
    if (Dimensions.isScalar(dimensions)) {
        return degree;
    }
    else if (Dimensions.isVector(dimensions)) {
        return new Array(dimensions[0]).fill(degree);
    }
    else {
        return new Array(dimensions[0]).fill(new Array(dimensions[1]).fill(degree));
    }
}