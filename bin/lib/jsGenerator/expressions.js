"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const expressions_1 = require("../expressions");
const utils_1 = require("./utils");
// CODE GENERATOR CLASS
// ================================================================================================
class ExpressionCodeGenerator extends expressions_1.ExpressionVisitor {
    // LITERALS
    // --------------------------------------------------------------------------------------------
    literalValue(e, options = {}) {
        if (e.isScalar) {
            return `${e.value}n`;
        }
        else if (e.isVector) {
            const code = `[${e.value.join('n, ')}n]`;
            return options.vectorAsArray ? code : `f.newVectorFrom(${code})`;
        }
        else {
            const rows = e.value.map(r => `[${r.join('n, ')}n]`);
            return `f.newMatrixFrom([${rows.join(', ')}])`;
        }
    }
    // OPERATIONS
    // --------------------------------------------------------------------------------------------
    binaryOperation(e, options = {}) {
        const jsFunction = utils_1.getBinaryFunction(e.operation, e.lhs, e.rhs);
        let code = `f.${jsFunction}(${this.visit(e.lhs)}, ${this.visit(e.rhs)})`;
        if (e.isVector && options.vectorAsArray) {
            code = `${code}.toValues()`;
        }
        return code;
    }
    unaryOperation(e, options = {}) {
        const jsFunction = utils_1.getUnaryFunction(e.operation, e.operand);
        let code = `f.${jsFunction}(${this.visit(e.operand)})`;
        if (e.isVector && options.vectorAsArray) {
            code = `${code}.toValues()`;
        }
        return code;
    }
    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    makeVector(e, options = {}) {
        const elements = e.elements.map(v => v.isVector ? `...${this.visit(v, { vectorAsArray: true })}` : this.visit(v));
        const code = `[${elements.join(', ')}]`;
        return options.vectorAsArray ? code : `f.newVectorFrom(${code})`;
    }
    getVectorElement(e) {
        return `${this.visit(e.source, { vectorAsArray: true })}[${e.index}]`;
    }
    sliceVector(e, options = {}) {
        const code = this.visit(e.source, { vectorAsArray: true });
        return (options.vectorAsArray)
            ? `${code}.slice(${e.start}, ${e.end + 1})`
            : `f.newVectorFrom(${code}.slice(${e.start}, ${e.end + 1}))`;
    }
    makeMatrix(e) {
        const rows = e.elements.map(r => `[${r.map(v => this.visit(v)).join(', ')}]`);
        return `f.newMatrixFrom([${rows.join(', ')}])`;
    }
    // LOAD AND STORE
    // --------------------------------------------------------------------------------------------
    loadExpression(e, options = {}) {
        // TODO: revisit
        let code = '';
        if (e.binding instanceof expressions_1.LiteralValue) {
            code = `g[${e.index}]`;
        }
        else if (e.binding instanceof expressions_1.StoreExpression) {
            code = `v${e.index}`;
        }
        else if (e.binding instanceof expressions_1.TraceSegment) {
            if (e.binding.segment === 'static') {
                code = 'k';
            }
            else if (e.binding.segment === 'trace') {
                if (e.index === 0) {
                    code = 'r';
                }
                else if (e.index === 1) {
                    code = 'n';
                }
            }
        }
        if (e.isVector && options.vectorAsArray) {
            code = `${code}.toValues()`;
        }
        return code;
    }
    storeExpression(e) {
        return `v${e.index} = ${this.visit(e.value)};\n`;
    }
}
// PUBLIC FUNCTIONS
// ================================================================================================
const generator = new ExpressionCodeGenerator();
function toJsCode(e) {
    return generator.visit(e);
}
exports.toJsCode = toJsCode;
//# sourceMappingURL=expressions.js.map