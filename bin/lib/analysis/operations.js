"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// PUBLIC FUNCTIONS
// ================================================================================================
function getSimpleOperationCount(e) {
    if (e.isScalar)
        return 1;
    else if (e.isVector)
        return e.dimensions[0];
    else
        return e.dimensions[0] * e.dimensions[1];
}
exports.getSimpleOperationCount = getSimpleOperationCount;
function getExponentOperationCount(base, exponent) {
    const opCount = getSimpleOperationCount(base);
    let mulCount = 0;
    while (exponent) {
        exponent = exponent >> 1n;
        mulCount++;
    }
    return opCount * mulCount;
}
exports.getExponentOperationCount = getExponentOperationCount;
function getProductOperationCounts(lhs, rhs) {
    let add = 0, mul = 0;
    if (lhs.isVector) {
        mul += lhs.dimensions[0];
        add += lhs.dimensions[0] - 1;
    }
    else if (lhs.isMatrix && rhs.isVector) {
        mul += lhs.dimensions[0] * lhs.dimensions[1];
        add += rhs.dimensions[0] * (lhs.dimensions[1] - 1);
    }
    else {
        mul += lhs.dimensions[0] * lhs.dimensions[1] * rhs.dimensions[1];
        add += rhs.dimensions[0] * (lhs.dimensions[1] - 1) * rhs.dimensions[1];
    }
    return { add, mul };
}
exports.getProductOperationCounts = getProductOperationCounts;
function applySimpleOperation(degreeOp, lhs, rhs) {
    if (isScalar(lhs)) {
        const v2 = rhs;
        return {
            degree: degreeOp(lhs.degree, v2.degree),
            traceRefs: mergeReferences(lhs.traceRefs, v2.traceRefs),
            staticRefs: mergeReferences(lhs.staticRefs, v2.staticRefs)
        };
    }
    else if (isVector(lhs)) {
        return applyToVector(degreeOp, lhs, rhs);
    }
    else {
        return applyToMatrix(degreeOp, lhs, rhs);
    }
}
exports.applySimpleOperation = applySimpleOperation;
function applyExponent(lhs, rhs) {
    if (isScalar(lhs)) {
        return {
            degree: lhs.degree * rhs,
            traceRefs: lhs.traceRefs,
            staticRefs: lhs.staticRefs
        };
    }
    else if (isVector(lhs)) {
        return lhs.map(item => ({
            degree: item.degree * rhs,
            traceRefs: item.traceRefs,
            staticRefs: item.staticRefs
        }));
    }
    else {
        return lhs.map(row => row.map(item => ({
            degree: item.degree * rhs,
            traceRefs: item.traceRefs,
            staticRefs: item.staticRefs
        })));
    }
}
exports.applyExponent = applyExponent;
function applyProductOperation(lhs, rhs) {
    if (isVector(lhs) && isVector(rhs)) {
        return applyLinearCombination(lhs, rhs);
    }
    else if (isMatrix(lhs) && isVector(rhs)) {
        return applyMatrixVectorProduct(lhs, rhs);
    }
    else if (isMatrix(lhs) && isMatrix(rhs)) {
        return applyMatrixMatrixProduct(lhs, rhs);
    }
    else {
        throw new Error(`invalid product operation`);
    }
}
exports.applyProductOperation = applyProductOperation;
function maxDegree(d1, d2) {
    return (d1 > d2) ? d1 : d2;
}
exports.maxDegree = maxDegree;
function sumDegree(d1, d2) {
    return d1 + d2;
}
exports.sumDegree = sumDegree;
// HELPER FUNCTIONS
// ================================================================================================
function applyToVector(op, d1, d2) {
    const result = new Array(d1.length);
    for (let i = 0; i < d1.length; i++) {
        let v1 = d1[i];
        let v2 = (Array.isArray(d2) ? d2[i] : d2);
        result[i] = {
            degree: op(v1.degree, v2.degree),
            traceRefs: mergeReferences(v1.traceRefs, v2.traceRefs),
            staticRefs: mergeReferences(v1.staticRefs, v2.staticRefs)
        };
    }
    return result;
}
function applyToMatrix(op, d1, d2) {
    const result = new Array(d1.length);
    for (let i = 0; i < d1.length; i++) {
        result[i] = new Array(d1[i].length);
        for (let j = 0; j < d1[i].length; j++) {
            let v1 = d1[i][j];
            let v2 = (Array.isArray(d2) ? d2[i][j] : d2);
            result[i][j] = {
                degree: op(v1.degree, v2.degree),
                traceRefs: mergeReferences(v1.traceRefs, v2.traceRefs),
                staticRefs: mergeReferences(v1.staticRefs, v2.staticRefs)
            };
        }
    }
    return result;
}
function applyLinearCombination(d1, d2) {
    const traceRefs = new Set();
    const staticRefs = new Set();
    let degree = 0n;
    for (let i = 0; i < d1.length; i++) {
        let v1 = d1[i], v2 = d2[i];
        let d = v1.degree + v2.degree;
        if (d > degree) {
            degree = d;
        }
        v1.traceRefs.forEach(r => traceRefs.add(r));
        v2.traceRefs.forEach(r => traceRefs.add(r));
        v1.staticRefs.forEach(r => staticRefs.add(r));
        v2.staticRefs.forEach(r => staticRefs.add(r));
    }
    return { degree, traceRefs, staticRefs };
}
function applyMatrixVectorProduct(d1, d2) {
    const result = new Array();
    for (let row of d1) {
        result.push(applyLinearCombination(row, d2));
    }
    return result;
}
function applyMatrixMatrixProduct(d1, d2) {
    const n = d1.length;
    const m = d1[0].length;
    const p = d2[0].length;
    const result = new Array(n);
    for (let i = 0; i < n; i++) {
        let row = result[i] = new Array(p);
        for (let j = 0; j < p; j++) {
            let degree = 0n;
            let traceRefs = new Set();
            let staticRefs = new Set();
            for (let k = 0; k < m; k++) {
                let v1 = d1[i][k], v2 = d2[k][j];
                let d = v1.degree + v2.degree;
                if (d > degree) {
                    degree = d;
                }
                ;
                v1.traceRefs.forEach(r => traceRefs.add(r));
                v2.traceRefs.forEach(r => traceRefs.add(r));
                v1.staticRefs.forEach(r => staticRefs.add(r));
                v2.staticRefs.forEach(r => staticRefs.add(r));
            }
            row[j] = { degree, traceRefs, staticRefs };
        }
    }
    return result;
}
function isScalar(info) {
    return (!Array.isArray(info));
}
function isVector(info) {
    return (Array.isArray(info) && !Array.isArray(info[0]));
}
function isMatrix(info) {
    return (Array.isArray(info) && Array.isArray(info[0]));
}
function mergeReferences(r1, r2) {
    const result = new Set(r1);
    for (let r of r2) {
        result.add(r);
    }
    return result;
}
//# sourceMappingURL=operations.js.map