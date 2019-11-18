"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const StaticRegister_1 = require("./StaticRegister");
// CLASS DEFINITION
// ================================================================================================
class MaskRegister extends StaticRegister_1.StaticRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(source, value) {
        super();
        this.source = source;
        this.value = value;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(mask (input ${this.source}) (value ${this.value}))`;
    }
}
exports.MaskRegister = MaskRegister;
//# sourceMappingURL=MaskRegister.js.map