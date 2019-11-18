"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const StaticRegister_1 = require("./StaticRegister");
// CLASS DEFINITION
// ================================================================================================
class CyclicRegister extends StaticRegister_1.StaticRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values) {
        super();
        // make sure the length of values is at least 4; this is needed for FFT interpolation
        while (values.length < 4)
            values = values.concat(values);
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