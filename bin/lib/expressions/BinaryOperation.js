"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const Expression_1 = require("./Expression");
const utils_1 = require("./utils");
const LiteralValue_1 = require("./LiteralValue");
const LoadExpression_1 = require("./LoadExpression");
// CLASS DEFINITION
// ================================================================================================
class BinaryOperation extends Expression_1.Expression {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(operation, lhs, rhs) {
        let degree;
        if (operation === 'add' || operation === 'sub') {
            checkDimensions(lhs, rhs, operation);
            degree = utils_1.maxDegree(lhs.degree, rhs.degree);
        }
        else if (operation === 'mul') {
            checkDimensions(lhs, rhs, operation);
            degree = utils_1.sumDegree(lhs.degree, rhs.degree);
        }
        else if (operation === 'div') {
            checkDimensions(lhs, rhs, operation);
            degree = utils_1.sumDegree(lhs.degree, rhs.degree); // TODO: incorrect
        }
        else if (operation === 'exp') {
            const exponent = getExponentValue(rhs);
            degree = utils_1.mulDegree(lhs.degree, exponent);
        }
        else if (operation === 'prod') {
            degree = getProductDegree(lhs, rhs);
        }
        else {
            throw new Error(`binary operation '${operation}' is not valid`);
        }
        super(utils_1.degreeToDimensions(degree), degree, [lhs, rhs]);
        this.operation = operation;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get lhs() { return this.children[0]; }
    get rhs() { return this.children[1]; }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(${this.operation} ${this.lhs.toString()} ${this.rhs.toString()})`;
    }
}
exports.BinaryOperation = BinaryOperation;
// HELPER FUNCTIONS
// ================================================================================================
function checkDimensions(lhs, rhs, operation) {
    if (!rhs.isScalar && !lhs.isSameDimensions(rhs)) {
        const d1 = `${lhs.dimensions[0]}x${lhs.dimensions[1]}`;
        const d2 = `${rhs.dimensions[0]}x${rhs.dimensions[1]}`;
        if (operation === 'add')
            throw new Error(`cannot add {${d1}} value to {${d2}} value`);
        else if (operation === 'sub')
            throw new Error(`cannot subtract {${d2}} value from {${d1}} value`);
        else if (operation === 'mul')
            throw new Error(`cannot multiply {${d1}} value by {${d2}} value`);
        else if (operation === 'div')
            throw new Error(`cannot divide {${d1}} value by {${d2}} value`);
    }
}
function getProductDegree(rhs, lhs) {
    const d1 = lhs.dimensions;
    const d2 = rhs.dimensions;
    if (lhs.isVector && rhs.isVector) {
        if (d1[0] !== d2[0])
            throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
        return utils_1.linearCombinationDegree(lhs.degree, rhs.degree);
    }
    else if (lhs.isMatrix && rhs.isVector) {
        if (d1[1] !== d2[0])
            throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
        return utils_1.matrixVectorProductDegree(lhs.degree, rhs.degree);
    }
    else if (lhs.isMatrix && rhs.isMatrix) {
        if (d1[1] !== d2[0])
            throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
        return utils_1.matrixMatrixProductDegree(lhs.degree, rhs.degree);
    }
    else {
        throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
    }
}
function getExponentValue(exp) {
    if (!exp.isScalar)
        throw new Error(`cannot raise to non-scalar power`);
    if (exp instanceof LiteralValue_1.LiteralValue) {
        return exp.value;
    }
    else if (exp instanceof LoadExpression_1.LoadExpression && exp.binding instanceof LiteralValue_1.LiteralValue) {
        return exp.binding.value;
    }
    else {
        throw new Error(`cannot raise to non-constant power`);
    }
}
//# sourceMappingURL=BinaryOperation.js.map