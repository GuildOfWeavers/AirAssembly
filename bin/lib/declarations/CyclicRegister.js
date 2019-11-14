"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class CyclicRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values) {
        if (!utils_1.isPowerOf2(values.length))
            throw new Error(`number of values in a cyclic register must be a power of 2, but ${values.length} values provided`);
        this.values = values;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(cycle ${this.values.join(' ')})`;
    }
}
exports.CyclicRegister = CyclicRegister;
//# sourceMappingURL=CyclicRegister.js.map