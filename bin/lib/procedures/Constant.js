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
    get isStatic() {
        return true;
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
        const handle = this.handle ? ` ${this.handle} ` : ' ';
        if (this.isScalar) {
            return `(const${handle}scalar ${this.value.value})`;
        }
        else if (this.isVector) {
            return `(const${handle}vector ${this.value.value.join(' ')})`;
        }
        else {
            const rows = this.value.value.map(r => `(${r.join(' ')})`);
            return `(const${handle}matrix ${rows.join(' ')})`;
        }
    }
}
exports.Constant = Constant;
//# sourceMappingURL=Constant.js.map