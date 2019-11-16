"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// LOAD SOURCE
// ================================================================================================
const sources = {
    'load.const': 'const',
    'load.trace': 'trace',
    'load.static': 'static',
    'load.local': 'local',
};
function getLoadSource(operation) {
    const source = sources[operation];
    if (!source) {
        throw new Error(`${operation} is not a valid load operation`);
    }
    return source;
}
exports.getLoadSource = getLoadSource;
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
})(Dimensions = exports.Dimensions || (exports.Dimensions = {}));
//# sourceMappingURL=utils.js.map