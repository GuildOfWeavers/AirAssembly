"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class Constant {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(value, handle) {
        this.value = value;
        if (handle !== undefined) {
            this.handle = utils_1.validateHandle(handle);
        }
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get dimensions() {
        return this.value.dimensions;
    }
    get isScalar() {
        return this.value.isScalar;
    }
    get isVector() {
        return this.value.isVector;
    }
    get isMatrix() {
        return this.value.isMatrix;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    validate(field) {
        for (let element of this.value.elements) {
            if (!field.isElement(element)) {
                throw new Error(`constant value ${element} is not a valid field element`);
            }
        }
    }
    toString() {
        return this.value.toString();
    }
}
exports.Constant = Constant;
//# sourceMappingURL=Constant.js.map