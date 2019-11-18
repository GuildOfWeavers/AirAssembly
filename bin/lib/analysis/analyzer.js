"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expressions_1 = require("../expressions");
const degree_1 = require("./degree");
const operations_1 = require("./operations");
// EXPRESSION ANALYZER CLASS
// ================================================================================================
class ExpressionAnalyzer extends expressions_1.ExpressionVisitor {
    // LITERALS
    // --------------------------------------------------------------------------------------------
    literalValue(e) {
        return 0n;
    }
    // OPERATIONS
    // --------------------------------------------------------------------------------------------
    binaryOperation(e, ctx) {
        operations_1.analyzeBinaryOperation(e, ctx.stats);
        const lhsDegree = this.visit(e.lhs, ctx);
        const rhsDegree = this.visit(e.rhs, ctx);
        const degree = degree_1.getBinaryOperationDegree(e, lhsDegree, rhsDegree);
        return degree;
    }
    unaryOperation(e, ctx) {
        operations_1.analyzeUnaryOperation(e, ctx.stats);
        const opDegree = this.visit(e, ctx);
        const degree = degree_1.getUnaryOperationDegree(e, opDegree);
        return degree;
    }
    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    makeVector(e, ctx) {
        let degree = [];
        for (let element of e.elements) {
            const elementDegree = this.visit(element, ctx);
            if (element.isScalar) {
                degree.push(elementDegree);
            }
            else if (element.isVector) {
                degree = degree.concat(elementDegree);
            }
        }
        return degree;
    }
    getVectorElement(e, ctx) {
        const sourceDegree = this.visit(e.source, ctx);
        return sourceDegree[e.index];
    }
    sliceVector(e, ctx) {
        const sourceDegree = this.visit(e.source, ctx);
        return sourceDegree.slice(e.start, e.end + 1);
    }
    makeMatrix(e, ctx) {
        const degree = [];
        for (let row of e.elements) {
            let rowDegree = [];
            for (let element of row) {
                const elementDegree = this.visit(element, ctx);
                if (element.isScalar) {
                    rowDegree.push(elementDegree);
                }
            }
            degree.push(rowDegree);
        }
        return degree;
    }
    // LOAD AND STORE
    // --------------------------------------------------------------------------------------------
    loadExpression(e, ctx) {
        if (e.source === 'const')
            return ctx.degree.const[0];
        else if (e.source === 'local')
            return ctx.degree.local[0];
        else if (e.source === 'static')
            return ctx.degree.static;
        else
            return ctx.degree.trace;
    }
}
// PUBLIC FUNCTIONS
// ================================================================================================
const analyzer = new ExpressionAnalyzer();
function analyzeProcedure(procedure) {
    // initialize context
    const context = {
        degree: {
            const: procedure.constants.map(c => dimensionsToDegree(c.dimensions, 0n)),
            local: new Array(procedure.locals.length),
            static: dimensionsToDegree(procedure.staticRegisters.dimensions, 1n),
            trace: dimensionsToDegree(procedure.traceRegisters.dimensions, 1n)
        },
        stats: { add: 0, mul: 0, inv: 0 }
    };
    // analyze subroutines
    procedure.subroutines.forEach(s => {
        const degree = analyzer.visit(s.expression, context);
        context.degree.local[s.localVarIdx] = degree;
    });
    // analyze result and return
    const degree = analyzer.visit(procedure.result, context);
    return { degree, operations: context.stats };
}
exports.analyzeProcedure = analyzeProcedure;
// HELPER FUNCTIONS
// ================================================================================================
function dimensionsToDegree(dimensions, degree) {
    if (expressions_1.Dimensions.isScalar(dimensions)) {
        return degree;
    }
    else if (expressions_1.Dimensions.isVector(dimensions)) {
        return new Array(dimensions[0]).fill(degree);
    }
    else {
        return new Array(dimensions[0]).fill(new Array(dimensions[1]).fill(degree));
    }
}
//# sourceMappingURL=analyzer.js.map