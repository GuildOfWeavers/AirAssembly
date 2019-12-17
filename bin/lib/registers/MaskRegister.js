"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StaticRegister_1 = require("./StaticRegister");
// CLASS DEFINITION
// ================================================================================================
class MaskRegister extends StaticRegister_1.StaticRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(source, inverted) {
        super();
        this.source = source;
        this.inverted = inverted;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(mask (input ${this.source}))`;
    }
}
exports.MaskRegister = MaskRegister;
//# sourceMappingURL=MaskRegister.js.map