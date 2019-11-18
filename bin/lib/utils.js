"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function getCompositionFactor(schema) {
    return 2 ** Math.ceil(Math.log2(schema.maxConstraintDegree));
}
exports.getCompositionFactor = getCompositionFactor;
//# sourceMappingURL=utils.js.map