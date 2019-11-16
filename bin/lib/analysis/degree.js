"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
// PUBLIC FUNCTIONS
// ================================================================================================
function getBinaryOperationDegree(e, lhsDegree, rhsDegree) {
    const op = e.operation;
    if (op === 'add' || op === 'sub') {
        return maxDegree(lhsDegree, rhsDegree);
    }
    else if (op === 'mul') {
        return sumDegree(lhsDegree, rhsDegree);
    }
    else if (op === 'div') {
        return sumDegree(lhsDegree, rhsDegree); // TODO: incorrect
    }
    else if (op === 'exp') {
        const exponent = utils_1.getExponentValue(e.rhs);
        return mulDegree(lhsDegree, exponent);
    }
    else if (op === 'prod') {
        if (e.lhs.isVector && e.rhs.isVector) {
            return linearCombinationDegree(lhsDegree, rhsDegree);
        }
        else if (e.lhs.isMatrix && e.rhs.isVector) {
            return matrixVectorProductDegree(lhsDegree, rhsDegree);
        }
        else if (e.lhs.isMatrix && e.rhs.isMatrix) {
            return matrixMatrixProductDegree(lhsDegree, rhsDegree);
        }
    }
    throw new Error(`invalid binary operation '${e.operation}'`);
}
exports.getBinaryOperationDegree = getBinaryOperationDegree;
function getUnaryOperationDegree(e, opDegree) {
    if (e.operation === 'neg') {
        return opDegree;
    }
    else if (e.operation === 'inv') {
        return opDegree; // TODO: incorrect
    }
    throw new Error(`invalid unary operation '${e.operation}'`);
}
exports.getUnaryOperationDegree = getUnaryOperationDegree;
// HELPER FUNCTIONS
// ================================================================================================
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
function matrixVectorProductDegree(d1, d2) {
    const result = new Array();
    for (let row of d1) {
        result.push(linearCombinationDegree(row, d2));
    }
    return result;
}
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
//# sourceMappingURL=degree.js.map