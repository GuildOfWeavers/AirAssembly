"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const crypto = require("crypto");
// PUBLIC FUNCTIONS
// ================================================================================================
function isPowerOf2(value) {
    if (typeof value === 'bigint') {
        return (value !== 0n) && (value & (value - 1n)) === 0n;
    }
    else {
        return (value !== 0) && (value & (value - 1)) === 0;
    }
}
exports.isPowerOf2 = isPowerOf2;
function getCompositionFactor(component) {
    return 2 ** Math.ceil(Math.log2(component.maxConstraintDegree));
}
exports.getCompositionFactor = getCompositionFactor;
// VALIDATORS
// ================================================================================================
function validate(condition, errorMessage) {
    if (!condition)
        throw new Error(errorMessage);
}
exports.validate = validate;
function validateHandle(handle) {
    // TODO: implement
    return handle;
}
exports.validateHandle = validateHandle;
// PRNG FUNCTIONS
// ================================================================================================
function sha256prng(seed, count, field) {
    const values = [];
    const vSeed = Buffer.concat([Buffer.from([0, 0]), seed]);
    for (let i = 0; i < count; i++) {
        vSeed.writeUInt16BE(i + 1, 0);
        let value = crypto.createHash('sha256').update(vSeed).digest();
        values[i] = field.add(BigInt(`0x${value.toString('hex')}`), 0n);
    }
    return values;
}
exports.sha256prng = sha256prng;
//# sourceMappingURL=utils.js.map