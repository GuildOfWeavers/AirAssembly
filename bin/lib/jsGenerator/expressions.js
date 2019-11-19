"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const expressions_1 = require("../expressions");
const utils_1 = require("./utils");
const procedures_1 = require("../procedures");
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
    // LOAD EXPRESSION
    // --------------------------------------------------------------------------------------------
    loadExpression(e, options = {}) {
        let code = '';
        if (e.binding instanceof expressions_1.TraceSegment) {
            code = getRegisterBankReference(e);
            if (!options.vectorAsArray) {
                code = `f.newVectorFrom(${code})`;
            }
        }
        else {
            if (e.binding instanceof expressions_1.LiteralValue) {
                code = `g[${e.index}]`;
            }
            else if (e.binding instanceof procedures_1.Subroutine) {
                code = `v${e.index}`;
            }
            if (e.isVector && options.vectorAsArray) {
                code = `${code}.toValues()`;
            }
        }
        return code;
    }
}
// PUBLIC FUNCTIONS
// ================================================================================================
const generator = new ExpressionCodeGenerator();
function toJsCode(e, options = {}) {
    return generator.visit(e, options);
}
exports.toJsCode = toJsCode;
// HELPER FUNCTIONS
// ================================================================================================
function getRegisterBankReference(e) {
    switch (`${e.source}:${e.index}`) {
        case 'static:0': {
            return 'k';
        }
        case `trace:0`: {
            return 'r';
        }
        case `trace:1`: {
            return 'n';
        }
        default: {
            throw new Error(`load source '${e.source}:${e.index}' is invalid`);
        }
    }
}
//# sourceMappingURL=expressions.js.map