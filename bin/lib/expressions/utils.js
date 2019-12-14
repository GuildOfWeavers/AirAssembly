"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// STORE TARGET
// ================================================================================================
const targets = {
    'store.local': 'local'
};
function getStoreTarget(operation) {
    const target = targets[operation];
    if (!target) {
        throw new Error(`${operation} is not a valid store operation`);
    }
    return target;
}
exports.getStoreTarget = getStoreTarget;
var Dimensions;
(function (Dimensions) {
    function scalar() {
        return [0, 0];
    }
    Dimensions.scalar = scalar;
    function vector(length) {
        return [length, 0];
    }
    Dimensions.vector = vector;
    function matrix(rows, columns) {
        return [rows, columns];
    }
    Dimensions.matrix = matrix;
    function isScalar(dimensions) {
        return (dimensions[0] === 0 && dimensions[1] === 0);
    }
    Dimensions.isScalar = isScalar;
    function isVector(dimensions) {
        return (dimensions[0] > 0 && dimensions[1] === 0);
    }
    Dimensions.isVector = isVector;
    function isMatrix(dimensions) {
        return (dimensions[1] > 0);
    }
    Dimensions.isMatrix = isMatrix;
    function areSameDimensions(d1, d2) {
        return d1[0] === d2[0] && d1[1] === d2[1];
    }
    Dimensions.areSameDimensions = areSameDimensions;
    function toExpressionString(d) {
        if (Dimensions.isScalar(d))
            return `scalar`;
        else if (Dimensions.isVector(d))
            return `vector ${d[0]}`;
        else if (Dimensions.isMatrix(d))
            return `matrix ${d[0]} ${d[1]}`;
        else
            throw new Error(`dimensions object ${d} is invalid`);
    }
    Dimensions.toExpressionString = toExpressionString;
    function toString(d) {
        if (Dimensions.isScalar(d))
            return `scalar`;
        else if (Dimensions.isVector(d))
            return `vector[${d[0]}]`;
        else if (Dimensions.isMatrix(d))
            return `matrix[${d[0]},${d[1]}]`;
        else
            throw new Error(`dimensions object ${d} is invalid`);
    }
    Dimensions.toString = toString;
})(Dimensions = exports.Dimensions || (exports.Dimensions = {}));
//# sourceMappingURL=utils.js.map