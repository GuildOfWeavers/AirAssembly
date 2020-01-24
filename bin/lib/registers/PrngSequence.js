"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class PrngSequence {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(method, seed, count) {
        if (method !== 'sha256')
            throw new Error(`prng method: '${method}' is not supported`);
        this.method = method;
        this.seed = Buffer.from(seed.toString(16).padStart(2, '0'), 'hex');
        this.length = count;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getValues(field) {
        if (!this._values) {
            this._values = utils_1.sha256prng(this.seed, this.length, field);
        }
        return this._values;
    }
    toString() {
        return `(prng ${this.method} 0x${this.seed.toString('hex')} ${this.length})`;
    }
}
exports.PrngSequence = PrngSequence;
//# sourceMappingURL=PrngSequence.js.map