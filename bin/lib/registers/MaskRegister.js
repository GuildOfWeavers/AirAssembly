"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class MaskRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(index, source, value) {
        this.index = index;
        this.source = source;
        this.value = value;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get type() {
        return 'mask';
    }
    get secret() {
        return false;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(mask (input ${this.source}) (value ${this.value}))`;
    }
}
exports.MaskRegister = MaskRegister;
//# sourceMappingURL=MaskRegister.js.map