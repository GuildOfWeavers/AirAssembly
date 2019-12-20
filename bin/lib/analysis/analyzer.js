"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expressions_1 = require("../expressions");
const operations_1 = require("./operations");
const utils_1 = require("./utils");
// EXPRESSION ANALYZER CLASS
// ================================================================================================
class ExpressionAnalyzer extends expressions_1.ExpressionVisitor {
    // LITERALS
    // --------------------------------------------------------------------------------------------
    literalValue(e) {
        return dimensionsToInfo(e.dimensions, 0n);
    }
    // OPERATIONS
    // --------------------------------------------------------------------------------------------
    binaryOperation(e, ctx) {
        const lhsInfo = this.visit(e.lhs, ctx);
        const rhsInfo = this.visit(e.rhs, ctx);
        switch (e.operation) {
            case 'add':
            case 'sub': {
                ctx.stats.add += operations_1.getSimpleOperationCount(e.lhs);
                return operations_1.applySimpleOperation(operations_1.maxDegree, lhsInfo, rhsInfo);
            }
            case 'mul': {
                ctx.stats.mul += operations_1.getSimpleOperationCount(e.lhs);
                return operations_1.applySimpleOperation(operations_1.sumDegree, lhsInfo, rhsInfo);
            }
            case 'div': {
                ctx.stats.mul += operations_1.getSimpleOperationCount(e.lhs);
                ctx.stats.inv += 1;
                return operations_1.applySimpleOperation(operations_1.sumDegree, lhsInfo, rhsInfo); // TODO: incorrect degree
            }
            case 'exp': {
                const exponent = utils_1.getExponentValue(e.rhs);
                ctx.stats.mul += operations_1.getExponentOperationCount(e.lhs, exponent);
                return operations_1.applyExponentOperation(lhsInfo, exponent);
            }
            case 'prod': {
                const counts = operations_1.getProductOperationCounts(e.lhs, e.rhs);
                ctx.stats.mul += counts.mul;
                ctx.stats.add += counts.add;
                return operations_1.applyProductOperation(lhsInfo, rhsInfo);
            }
        }
    }
    unaryOperation(e, ctx) {
        const operandInfo = this.visit(e.operand, ctx);
        switch (e.operation) {
            case 'neg': {
                ctx.stats.add += operations_1.getSimpleOperationCount(e.operand);
                return operandInfo;
            }
            case 'inv': {
                ctx.stats.inv += operations_1.getSimpleOperationCount(e.operand);
                return operandInfo; // TODO: incorrect degree
            }
        }
    }
    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    makeVector(e, ctx) {
        let result = [];
        for (let element of e.elements) {
            const elementInfo = this.visit(element, ctx);
            if (element.isScalar) {
                result.push(elementInfo);
            }
            else if (element.isVector) {
                result = result.concat(elementInfo);
            }
        }
        return result;
    }
    getVectorElement(e, ctx) {
        const sourceItems = this.visit(e.source, ctx);
        return sourceItems[e.index];
    }
    sliceVector(e, ctx) {
        const sourceItems = this.visit(e.source, ctx);
        return sourceItems.slice(e.start, e.end + 1);
    }
    makeMatrix(e, ctx) {
        const result = [];
        for (let row of e.elements) {
            let rowInfo = [];
            for (let element of row) {
                const elementInfo = this.visit(element, ctx);
                if (element.isScalar) {
                    rowInfo.push(elementInfo);
                }
                else if (element.isVector) {
                    rowInfo = rowInfo.concat(elementInfo);
                }
            }
            result.push(rowInfo);
        }
        return result;
    }
    // LOAD AND STORE
    // --------------------------------------------------------------------------------------------
    loadExpression(e, ctx) {
        switch (e.source) {
            case 'const': return ctx.info.const[e.index];
            case 'param': return ctx.info.param[e.index];
            case 'local': return ctx.info.local[e.index];
            case 'trace': return dimensionsToInfo(ctx.info.trace, 1n, new Set([e.index]), new Set());
            case 'static': return dimensionsToInfo(ctx.info.static, 1n, new Set(), new Set([e.index]));
        }
    }
    // CALL EXPRESSION
    // --------------------------------------------------------------------------------------------
    callExpression(e, ctx) {
        const fnContext = {
            info: { ...ctx.info, param: [], local: [] },
            stats: ctx.stats
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
function analyzeProcedure(procedure) {
    // initialize context
    const context = {
        info: {
            const: procedure.constants.map(c => dimensionsToInfo(c.dimensions)),
            param: [],
            local: new Array(procedure.locals.length),
            static: procedure.staticRegisters.dimensions,
            trace: procedure.traceRegisters.dimensions
        },
        stats: { add: 0, mul: 0, inv: 0 }
    };
    // analyze statements
    procedure.statements.forEach(s => {
        context.info.local[s.target] = analyzer.visit(s.expression, context);
    });
    // analyze result and return
    const procedureInfo = analyzer.visit(procedure.result, context);
    const results = procedureInfo.map(item => ({
        degree: item.degree,
        traceRefs: Array.from(item.traceRefs).sort((a, b) => a - b),
        staticRefs: Array.from(item.staticRefs).sort((a, b) => a - b)
    }));
    return { results, operations: context.stats };
}
exports.analyzeProcedure = analyzeProcedure;
// HELPER FUNCTIONS
// ================================================================================================
function dimensionsToInfo(dimensions, degree = 0n, traceRefs = new Set(), staticRefs = new Set()) {
    if (expressions_1.Dimensions.isScalar(dimensions)) {
        return { degree, staticRefs, traceRefs };
    }
    else if (expressions_1.Dimensions.isVector(dimensions)) {
        return new Array(dimensions[0]).fill({ degree, staticRefs, traceRefs });
    }
    else {
        return new Array(dimensions[0]).fill(new Array(dimensions[1]).fill({ degree, staticRefs, traceRefs }));
    }
}
//# sourceMappingURL=analyzer.js.map