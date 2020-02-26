"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StaticRegister_1 = require("./StaticRegister");
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class CyclicRegister extends StaticRegister_1.StaticRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values, field) {
        super();
        utils_1.validate(values.length > 1, errors.valueLengthSmallerThan2());
        utils_1.validate(utils_1.isPowerOf2(values.length), errors.valueLengthNotPowerOf2());
        if (Array.isArray(values)) {
            values.forEach(v => utils_1.validate(field.isElement(v), errors.valueNotFieldElement(v)));
        }
        this.values = values;
        this.field = field;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get cycleLength() {
        return this.values.length;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getValues() {
        if (Array.isArray(this.values)) {
            return this.values;
        }
        else {
            return this.values.getValues(this.field);
        }
    }
    toString() {
        const values = (Array.isArray(this.values))
            ? this.values.join(' ')
            : this.values.toString();
        return `(cycle ${values})`;
    }
}
exports.CyclicRegister = CyclicRegister;
// ERRORS
// ================================================================================================
const errors = {
    valueNotFieldElement: (v) => `${v} is not a valid field element`,
    valueLengthNotPowerOf2: () => `number of values in a cyclic register must be a power of 2`,
    valueLengthSmallerThan2: () => `number of values in a cyclic register must be greater than 1`
};
//# sourceMappingURL=CyclicRegister.js.map