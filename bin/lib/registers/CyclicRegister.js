"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class CyclicRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(index, values) {
        if (!utils_1.isPowerOf2(values.length))
            throw new Error(`number of values in a cyclic register must be a power of 2, but ${values.length} values provided`);
        this.index = index;
        this.values = values;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get type() {
        return 'cyclic';
    }
    get secret() {
        return false;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(cycle ${this.values.join(' ')})`;
    }
}
exports.CyclicRegister = CyclicRegister;
//# sourceMappingURL=CyclicRegister.js.map