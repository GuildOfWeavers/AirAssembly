"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
// CLASS DEFINITION
// ================================================================================================
class Expression {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(dimensions, degree, children = []) {
        this.dimensions = dimensions;
        this.degree = degree;
        this.children = children;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    compress() {
        this.children.forEach(child => child.compress());
    }
    collectLoadOperations(source, result) {
        this.children.forEach(child => child.collectLoadOperations(source, result));
    }
    replace(oldExpression, newExpression) {
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i] === oldExpression) {
                this.children[i] = newExpression;
            }
            else {
                this.children[i].replace(oldExpression, newExpression);
            }
        }
    }
    updateAccessorIndex(source, fromIdx, toIdx) {
        this.children.forEach(child => child.updateAccessorIndex(source, fromIdx, toIdx));
    }
    // DIMENSION METHODS AND ACCESSORS
    // --------------------------------------------------------------------------------------------
    get isScalar() {
        return utils_1.Dimensions.isScalar(this.dimensions);
    }
    get isVector() {
        return utils_1.Dimensions.isVector(this.dimensions);
    }
    get isMatrix() {
        return utils_1.Dimensions.isMatrix(this.dimensions);
    }
    isSameDimensions(e) {
        return utils_1.Dimensions.areSameDimensions(this.dimensions, e.dimensions);
    }
}
exports.Expression = Expression;
//# sourceMappingURL=Expression.js.map