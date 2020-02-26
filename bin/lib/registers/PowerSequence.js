"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class PowerSequence {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(base, count) {
        this.base = base;
        this.length = count;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getValues(field) {
        if (!this._values) {
            this._values = [];
            for (let i = 0; i < this.length; i++) {
                this._values.push(field.exp(this.base, BigInt(i)));
            }
        }
        return this._values;
    }
    toString() {
        return `(power ${this.base} ${this.length})`;
    }
}
exports.PowerSequence = PowerSequence;
//# sourceMappingURL=PowerSequence.js.map