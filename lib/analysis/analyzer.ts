// IMPORTS
// ================================================================================================
import { ExpressionDegree } from "@guildofweavers/air-assembly";
import { Procedure } from "../procedures";
import {
    ExpressionVisitor, LiteralValue, BinaryOperation, UnaryOperation, MakeVector,
    GetVectorElement, SliceVector, MakeMatrix, LoadExpression, Dimensions
} from "../expressions";
import { getBinaryOperationDegree, getUnaryOperationDegree } from "./degree";
import { analyzeBinaryOperation, analyzeUnaryOperation, OperationStats } from "./operations";

// INTERFACES
// ================================================================================================
interface AnalysisContext {
    degree: {
        const   : ExpressionDegree[];
        local   : ExpressionDegree[];
        static  : ExpressionDegree;
        trace   : ExpressionDegree;
    }
    stats       : OperationStats;
}

// EXPRESSION ANALYZER CLASS
// ================================================================================================
class ExpressionAnalyzer extends ExpressionVisitor<ExpressionDegree> {

    // LITERALS
    // --------------------------------------------------------------------------------------------
    literalValue(e: LiteralValue): ExpressionDegree {
        return 0n;
    }

    // OPERATIONS
    // --------------------------------------------------------------------------------------------
    binaryOperation(e: BinaryOperation, ctx: AnalysisContext): ExpressionDegree {
        analyzeBinaryOperation(e, ctx.stats);
        const lhsDegree = this.visit(e.lhs, ctx);
        const rhsDegree = this.visit(e.rhs, ctx);
        const degree = getBinaryOperationDegree(e, lhsDegree, rhsDegree);
        return degree;
    }

    unaryOperation(e: UnaryOperation, ctx: AnalysisContext): ExpressionDegree {
        analyzeUnaryOperation(e, ctx.stats);
        const opDegree = this.visit(e, ctx);
        const degree = getUnaryOperationDegree(e, opDegree);
        return degree;
    }

    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    makeVector(e: MakeVector, ctx: AnalysisContext): ExpressionDegree {
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

    getVectorElement(e: GetVectorElement, ctx: AnalysisContext): ExpressionDegree {
        const sourceDegree = this.visit(e.source, ctx) as bigint[];
        return sourceDegree[e.index];
    }

    sliceVector(e: SliceVector, ctx: AnalysisContext): ExpressionDegree {
        const sourceDegree = this.visit(e.source, ctx) as bigint[];
        return sourceDegree.slice(e.start, e.end + 1);
    }

    makeMatrix(e: MakeMatrix, ctx: AnalysisContext): ExpressionDegree {
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
    loadExpression(e: LoadExpression, ctx: AnalysisContext): ExpressionDegree {
        if (e.source === 'const') return ctx.degree.const[0];
        else if (e.source === 'local') return ctx.degree.local[0];
        else if (e.source === 'static') return ctx.degree.static;
        else return ctx.degree.trace;
    }
}

// PUBLIC FUNCTIONS
// ================================================================================================
const analyzer = new ExpressionAnalyzer();
export function analyzeProcedure(procedure: Procedure) {

    // initialize context
    const context: AnalysisContext = {
        degree: {
            const   : procedure.constants.map(c => dimensionsToDegree(c.dimensions, 0n)),
            local   : new Array(procedure.locals.length),
            static  : dimensionsToDegree(procedure.staticRegisters.dimensions, 1n),
            trace   : dimensionsToDegree(procedure.traceRegisters.dimensions, 1n)
        },
        stats: { add: 0, mul: 0, inv: 0 }
    }

    // analyze subroutines
    procedure.subroutines.forEach(s => {
        const degree = analyzer.visit(s.expression, context);
        context.degree.local[s.localVarIdx] = degree;
    })

    // analyze result and return
    const degree = analyzer.visit(procedure.result, context) as bigint[];
    return { degree, stats: context.stats };
}

// HELPER FUNCTIONS
// ================================================================================================
function dimensionsToDegree(dimensions: Dimensions, degree: bigint): ExpressionDegree {
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