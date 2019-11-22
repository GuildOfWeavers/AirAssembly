"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const StaticRegister_1 = require("./StaticRegister");
const PrngSequence_1 = require("./PrngSequence");
// CLASS DEFINITION
// ================================================================================================
class CyclicRegister extends StaticRegister_1.StaticRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values) {
        super();
        this.values = values;
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
//# sourceMappingURL=CyclicRegister.js.map