"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Expression_1 = require("./Expression");
const utils_1 = require("./utils");
// CLASS DEFINITION
// ================================================================================================
class BinaryOperation extends Expression_1.Expression {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(operation, lhs, rhs) {
        let dimensions;
        if (operation === 'add' || operation === 'sub' || operation === 'mul' || operation === 'div') {
            checkDimensions(lhs, rhs, operation);
            dimensions = lhs.dimensions;
        }
        else if (operation === 'exp') {
            checkExponent(rhs);
            dimensions = lhs.dimensions;
        }
        else if (operation === 'prod') {
            dimensions = getProductDimensions(lhs, rhs);
        }
        else {
            throw new Error(`binary operation '${operation}' is not valid`);
        }
        super(dimensions, [lhs, rhs]);
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
    if (!rhs.isScalar && !utils_1.Dimensions.areSameDimensions(lhs.dimensions, rhs.dimensions)) {
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
function checkExponent(exp) {
    if (!exp.isScalar)
        throw new Error(`cannot raise to non-scalar power`);
    if (!exp.isStatic)
        throw new Error(`cannot raise to non-constant power`);
}
function getProductDimensions(lhs, rhs) {
    const d1 = lhs.dimensions;
    const d2 = rhs.dimensions;
    if (lhs.isVector && rhs.isVector) {
        if (d1[0] !== d2[0])
            throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
        return utils_1.Dimensions.scalar();
    }
    else if (lhs.isMatrix && rhs.isVector) {
        if (d1[1] !== d2[0])
            throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
        return utils_1.Dimensions.vector(lhs.dimensions[0]);
    }
    else if (lhs.isMatrix && rhs.isMatrix) {
        if (d1[1] !== d2[0])
            throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
        return utils_1.Dimensions.matrix(lhs.dimensions[0], rhs.dimensions[1]);
    }
    else {
        throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
    }
}
//# sourceMappingURL=BinaryOperation.js.map