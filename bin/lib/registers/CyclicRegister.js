"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StaticRegister_1 = require("./StaticRegister");
const PrngSequence_1 = require("./PrngSequence");
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class CyclicRegister extends StaticRegister_1.StaticRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values) {
        super();
        utils_1.validate(values.length > 1, errors.valueLengthSmallerThan2());
        utils_1.validate(utils_1.isPowerOf2(values.length), errors.valueLengthNotPowerOf2());
        this.values = values;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get cycleLength() {
        return this.values.length;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getValues(field) {
        if (this.values instanceof PrngSequence_1.PrngSequence) {
            return this.values.getValues(field);
        }
        else {
            return this.values;
        }
    }
    toString() {
        const values = (this.values instanceof PrngSequence_1.PrngSequence)
            ? this.values.toString()
            : this.values.join(' ');
        return `(cycle ${values})`;
    }
}
exports.CyclicRegister = CyclicRegister;
// ERRORS
// ================================================================================================
const errors = {
    valueLengthNotPowerOf2: () => `number of values in a cyclic register must be a power of 2`,
    valueLengthSmallerThan2: () => `number of values in a cyclic register must be greater than 1`
};
//# sourceMappingURL=CyclicRegister.js.map