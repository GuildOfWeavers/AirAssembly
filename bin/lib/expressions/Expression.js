"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
// CLASS DEFINITION
// ================================================================================================
class Expression {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(dimensions, children = []) {
        this.dimensions = dimensions;
        this.children = children;
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