// IMPORTS
// ================================================================================================
import { Expression } from "../expressions";
import { ExpressionInfo, InfoItem } from "./analyzer";

// INTERFACES
// ================================================================================================
export interface OperationStats {
    add : number;
    mul : number;
    inv : number;
}

interface DegreeOp {
    (d1: bigint, d2: bigint): bigint;
}

// PUBLIC FUNCTIONS
// ================================================================================================
export function getSimpleOperationCount(e: Expression): number {
    if (e.isScalar) return 1;
    else if (e.isVector) return e.dimensions[0];
    else return e.dimensions[0] * e.dimensions[1];
}

export function getExponentOperationCount(base: Expression, exponent: bigint): number {
    const opCount = getSimpleOperationCount(base);
    let mulCount = 0;
    while (exponent) {
        exponent = exponent >> 1n;
        mulCount++;
    }
    return opCount * mulCount;
}

export function getProductOperationCounts(lhs: Expression, rhs: Expression): { add: number; mul: number } {
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

export function applySimpleOperation(degreeOp: DegreeOp, lhs: ExpressionInfo, rhs: ExpressionInfo): ExpressionInfo {
    if (isScalar(lhs)) {
        const v2 = rhs as InfoItem;
        return {
            degree      : degreeOp(lhs.degree, v2.degree),
            traceRefs   : mergeReferences(lhs.traceRefs, v2.traceRefs),
            staticRefs  : mergeReferences(lhs.staticRefs, v2.staticRefs)
        };
    }
    else if (isVector(lhs)) {
        return applyToVector(degreeOp, lhs, rhs as InfoItem[] | InfoItem);
    }
    else {
        return applyToMatrix(degreeOp, lhs, rhs as InfoItem[][] | InfoItem);
    }
}

export function applyExponent(lhs: ExpressionInfo, rhs: bigint): ExpressionInfo {
    if (isScalar(lhs)) {
        return {
            degree      : lhs.degree * rhs,
            traceRefs   : lhs.traceRefs,
            staticRefs  : lhs.staticRefs
        };
    }
    else if (isVector(lhs)) {
        return lhs.map(item => ({
            degree      : item.degree * rhs,
            traceRefs   : item.traceRefs,
            staticRefs  : item.staticRefs
        }));
    }
    else {
        return lhs.map(row => row.map(item => ({
            degree      : item.degree * rhs,
            traceRefs   : item.traceRefs,
            staticRefs  : item.staticRefs
        })));
    }
}

export function applyProductOperation(lhs: ExpressionInfo, rhs: ExpressionInfo): ExpressionInfo {
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

export function maxDegree(d1: bigint, d2: bigint): bigint {
    return (d1 > d2) ? d1 : d2;
}

export function sumDegree(d1: bigint, d2: bigint): bigint {
    return d1 + d2;
}

// HELPER FUNCTIONS
// ================================================================================================
function applyToVector(op: DegreeOp, d1: InfoItem[], d2: InfoItem[] | InfoItem): InfoItem[] {
    const result = new Array<InfoItem>(d1.length);
    for (let i = 0; i < d1.length; i++) {
        let v1 = d1[i];
        let v2 = (Array.isArray(d2) ? d2[i] : d2);
        result[i] = {
            degree      : op(v1.degree, v2.degree),
            traceRefs   : mergeReferences(v1.traceRefs, v2.traceRefs),
            staticRefs  : mergeReferences(v1.staticRefs, v2.staticRefs)
        };
    }
    return result;
}

function applyToMatrix(op: DegreeOp, d1: InfoItem[][], d2: InfoItem[][] | InfoItem) {
    const result = new Array<InfoItem[]>(d1.length);
    for (let i = 0; i < d1.length; i++) {
        result[i] = new Array<InfoItem>(d1[i].length);
        for (let j = 0; j < d1[i].length; j++) {
            let v1 = d1[i][j];
            let v2 = (Array.isArray(d2) ? d2[i][j] : d2);
            result[i][j] = {
                degree      : op(v1.degree, v2.degree),
                traceRefs   : mergeReferences(v1.traceRefs, v2.traceRefs),
                staticRefs  : mergeReferences(v1.staticRefs, v2.staticRefs)
            };
        }
    }
    return result;
}

function applyLinearCombination(d1: InfoItem[], d2: InfoItem[]): InfoItem {
    const traceRefs = new Set<number>();
    const staticRefs = new Set<number>();
    let degree = 0n;
    for (let i = 0; i < d1.length; i++) {
        let v1 = d1[i], v2 = d2[i];

        let d = v1.degree + v2.degree;
        if (d > degree) { degree = d; }

        v1.traceRefs.forEach(r => traceRefs.add(r));
        v2.traceRefs.forEach(r => traceRefs.add(r));

        v1.staticRefs.forEach(r => staticRefs.add(r));
        v2.staticRefs.forEach(r => staticRefs.add(r));
    }
    return { degree, traceRefs, staticRefs };
}

function applyMatrixVectorProduct(d1: InfoItem[][], d2: InfoItem[]): InfoItem[] {
    const result = new Array<InfoItem>();
    for (let row of d1) {
        result.push(applyLinearCombination(row, d2));
    }
    return result;
}

function applyMatrixMatrixProduct(d1: InfoItem[][], d2: InfoItem[][]): InfoItem[][] {
    const n = d1.length;
    const m = d1[0].length;
    const p = d2[0].length;

    const result = new Array<InfoItem[]>(n);
    for (let i = 0; i < n; i++) {
        let row = result[i] = new Array<InfoItem>(p);
        for (let j = 0; j < p; j++) {
            let degree = 0n;
            let traceRefs = new Set<number>();
            let staticRefs = new Set<number>();
            for (let k = 0; k < m; k++) {
                let v1 = d1[i][k], v2 = d2[k][j];

                let d = v1.degree + v2.degree;
                if (d > degree) { degree = d };

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

function isScalar(info: ExpressionInfo): info is InfoItem {
    return (!Array.isArray(info));
}

function isVector(info: ExpressionInfo): info is InfoItem[] {
    return (Array.isArray(info) && !Array.isArray(info[0]));
}

function isMatrix(info: ExpressionInfo): info is InfoItem[][] {
    return (Array.isArray(info) && Array.isArray(info[0]));
}

function mergeReferences(r1: Set<number>, r2: Set<number>): Set<number> {
    const result = new Set(r1);
    for (let r of r2) {
        result.add(r);
    }
    return result;
}