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
        let result;
        const lhsInfo = this.visit(e.lhs, ctx);
        const rhsInfo = this.visit(e.rhs, ctx);
        switch (e.operation) {
            case 'add':
            case 'sub': {
                ctx.stats.add += operations_1.getSimpleOperationCount(e.lhs);
                result = operations_1.applySimpleOperation(operations_1.maxDegree, lhsInfo, rhsInfo);
                break;
            }
            case 'mul': {
                ctx.stats.mul += operations_1.getSimpleOperationCount(e.lhs);
                result = operations_1.applySimpleOperation(operations_1.sumDegree, lhsInfo, rhsInfo);
                break;
            }
            case 'div': {
                ctx.stats.mul += operations_1.getSimpleOperationCount(e.lhs);
                ctx.stats.inv += 1;
                result = operations_1.applySimpleOperation(operations_1.sumDegree, lhsInfo, rhsInfo); // TODO: incorrect degree
                break;
            }
            case 'exp': {
                const exponent = utils_1.getExponentValue(e.rhs);
                ctx.stats.mul += operations_1.getExponentOperationCount(e.lhs, exponent);
                result = operations_1.applyExponent(lhsInfo, exponent);
                break;
            }
            case 'prod': {
                const counts = operations_1.getProductOperationCounts(e.lhs, e.rhs);
                ctx.stats.mul += counts.mul;
                ctx.stats.add += counts.add;
                result = operations_1.applyProductOperation(lhsInfo, rhsInfo);
                break;
            }
        }
        return result;
    }
    unaryOperation(e, ctx) {
        const operandInfo = this.visit(e.operand, ctx);
        if (e.operation === 'neg') {
            ctx.stats.add += operations_1.getSimpleOperationCount(e.operand);
            return operandInfo;
        }
        else if (e.operation === 'inv') {
            ctx.stats.inv += operations_1.getSimpleOperationCount(e.operand);
            return operandInfo; // TODO: incorrect degree
        }
        else {
            throw new Error(`unary operation '${e.operation}' is invalid`);
        }
    }
    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    makeVector(e, ctx) {
        let result = [];
        for (let element of e.elements) {
            const elementItem = this.visit(element, ctx);
            if (element.isScalar) {
                result.push(elementItem);
            }
            else if (element.isVector) {
                result = result.concat(elementItem);
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
    loadExpression(e, ctx) {
        if (e.source === 'const')
            return ctx.info.const[e.index];
        else if (e.source === 'param')
            return ctx.info.param[e.index];
        else if (e.source === 'local')
            return ctx.info.local[e.index];
        else if (e.source === 'static') {
            const result = [];
            const info = { degree: 1n, staticRefs: new Set([e.index]), traceRefs: new Set() };
            for (let i = 0; i < ctx.info.static; i++) {
                result.push(info);
            }
            return result;
        }
        else if (e.source === 'trace') {
            const result = [];
            const info = { degree: 1n, staticRefs: new Set(), traceRefs: new Set([e.index]) };
            for (let i = 0; i < ctx.info.trace; i++) {
                result.push(info);
            }
            return result;
        }
        else
            throw new Error(`load source '${e.source}' is invalid`);
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
            const: procedure.constants.map(c => dimensionsToInfo(c.dimensions, 0n)),
            param: [],
            local: new Array(procedure.locals.length),
            static: procedure.staticRegisters.dimensions[0],
            trace: procedure.traceRegisters.dimensions[0]
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
function dimensionsToInfo(dimensions, degree) {
    if (expressions_1.Dimensions.isScalar(dimensions)) {
        return { degree, staticRefs: new Set(), traceRefs: new Set() };
    }
    else if (expressions_1.Dimensions.isVector(dimensions)) {
        const info = { degree, staticRefs: new Set(), traceRefs: new Set() };
        return new Array(dimensions[0]).fill(info);
    }
    else {
        const info = { degree, staticRefs: new Set(), traceRefs: new Set() };
        return new Array(dimensions[0]).fill(new Array(dimensions[1]).fill(info));
    }
}
//# sourceMappingURL=analyzer.js.map