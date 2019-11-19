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
    // ACCESSORS
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
    get isStatic() {
        return false;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    transform(transformer) {
        for (let i = 0; i < this.children.length; i++) {
            let oChild = this.children[i];
            let nChild = transformer(oChild);
            if (oChild !== nChild) {
                this.children[i] = nChild;
            }
            else {
                oChild.transform(transformer);
            }
        }
    }
    findPath(expression) {
        for (let i = 0; i < this.children.length; i++) {
            let child = this.children[i];
            if (child === expression) {
                return [i];
            }
            else {
                let subPath = child.findPath(expression);
                if (subPath) {
                    return [i, ...subPath];
                }
            }
        }
    }
}
exports.Expression = Expression;
//# sourceMappingURL=Expression.js.map