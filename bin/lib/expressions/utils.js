"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// LOAD SOURCE
// ================================================================================================
const sources = {
    'load.const': 'const',
    'load.trace': 'trace',
    'load.static': 'static',
    'load.input': 'input',
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
function maxDegree(d1, d2) {
    if (typeof d1 === 'bigint') {
        if (typeof d2 !== 'bigint')
            throw new Error('cannot infer max degree');
        return (d1 > d2 ? d1 : d2);
    }
    else if (typeof d1[0] === 'bigint') {
        return vectorDegree((a, b) => (a > b ? a : b), d1, d2);
    }
    else {
        return matrixDegree((a, b) => (a > b ? a : b), d1, d2);
    }
}
exports.maxDegree = maxDegree;
function sumDegree(d1, d2) {
    if (typeof d1 === 'bigint') {
        if (typeof d2 !== 'bigint')
            throw new Error('cannot infer sum degree');
        return d1 + d2;
    }
    else if (typeof d1[0] === 'bigint') {
        return vectorDegree((a, b) => (a + b), d1, d2);
    }
    else {
        return matrixDegree((a, b) => (a + b), d1, d2);
    }
}
exports.sumDegree = sumDegree;
function mulDegree(d1, d2) {
    if (typeof d1 === 'bigint') {
        if (typeof d2 !== 'bigint')
            throw new Error('cannot infer mul degree');
        return d1 * d2;
    }
    else if (typeof d1[0] === 'bigint') {
        return vectorDegree((a, b) => (a * b), d1, d2);
    }
    else {
        return matrixDegree((a, b) => (a * b), d1, d2);
    }
}
exports.mulDegree = mulDegree;
function linearCombinationDegree(d1, d2) {
    let result = 0n;
    for (let i = 0; i < d1.length; i++) {
        let d = d1[i] + d2[i];
        if (d > result) {
            result = d;
        }
    }
    return result;
}
exports.linearCombinationDegree = linearCombinationDegree;
function matrixVectorProductDegree(d1, d2) {
    const result = new Array();
    for (let row of d1) {
        result.push(linearCombinationDegree(row, d2));
    }
    return result;
}
exports.matrixVectorProductDegree = matrixVectorProductDegree;
function matrixMatrixProductDegree(d1, d2) {
    const n = d1.length;
    const m = d1[0].length;
    const p = d2[0].length;
    const result = new Array(n);
    for (let i = 0; i < n; i++) {
        let row = result[i] = new Array(p);
        for (let j = 0; j < p; j++) {
            let s = 0n;
            for (let k = 0; k < m; k++) {
                let d = d1[i][k] + d2[k][j];
                if (d > s) {
                    s = d;
                }
                ;
            }
            row[j] = s;
        }
    }
    return result;
}
exports.matrixMatrixProductDegree = matrixMatrixProductDegree;
function degreeToDimensions(degree) {
    if (typeof degree === 'bigint') {
        // degree describes a scalar
        return [0, 0];
    }
    if (!Array.isArray(degree))
        throw new Error(`degree '${degree}' is invalid`);
    if (degree.length === 0)
        throw new Error(`degree '${degree}' is invalid`);
    if (typeof degree[0] === 'bigint') {
        // degree describes a vector
        return [degree.length, 0];
    }
    let colCount = 0;
    for (let row of degree) {
        if (!Array.isArray(row))
            throw new Error(`degree '${degree}' is invalid`);
        if (!colCount)
            colCount = row.length;
        else if (colCount !== row.length)
            throw new Error(`degree '${degree}' is invalid`);
    }
    if (!colCount)
        throw new Error(`degree '${degree}' is invalid`);
    // degree describes a matrix
    return [degree.length, colCount];
}
exports.degreeToDimensions = degreeToDimensions;
// HELPER FUNCTIONS
// ================================================================================================
function vectorDegree(op, d1, d2) {
    const result = new Array(d1.length);
    for (let i = 0; i < d1.length; i++) {
        let v2 = (typeof d2 === 'bigint' ? d2 : d2[i]);
        result[i] = op(d1[i], v2);
    }
    return result;
}
function matrixDegree(op, d1, d2) {
    const result = new Array(d1.length);
    for (let i = 0; i < d1.length; i++) {
        result[i] = new Array(d1[i].length);
        for (let j = 0; j < d1[i].length; j++) {
            let v2 = (typeof d2 === 'bigint' ? d2 : d2[i][j]);
            result[i][j] = op(d1[i][j], v2);
        }
    }
    return result;
}
//# sourceMappingURL=utils.js.map