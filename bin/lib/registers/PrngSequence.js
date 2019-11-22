"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const crypto = require("crypto");
// CLASS DEFINITION
// ================================================================================================
class PrngSequence {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(method, seed, count) {
        if (method !== 'sha256')
            throw new Error(`prng method: '${method}' is not supported`);
        this.method = method;
        this.seed = Buffer.from(seed.toString(16), 'hex');
        this.length = count;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getValues(field) {
        if (!this._values) {
            this._values = generateValues(field, this.method, this.seed.toString('hex'), this.length);
        }
        return this._values;
    }
    toString() {
        return `(prng ${this.method} 0x${this.seed.toString('hex')} ${this.length})`;
    }
}
exports.PrngSequence = PrngSequence;
// HELPER FUNCTIONS
// ================================================================================================
function generateValues(field, method, seed, count) {
    const values = [];
    if (method === 'sha256') {
        for (let i = 0; i < count; i++) {
            let value = crypto.createHash('sha256').update(`${seed}${i}`).digest();
            values[i] = field.add(BigInt(`0x${value.toString('hex')}`), 0n);
        }
    }
    else {
        throw new Error(`'${method}' is not a valid prng method`);
    }
    return values;
}
//# sourceMappingURL=PrngSequence.js.map