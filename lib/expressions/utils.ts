// IMPORTS
// ================================================================================================
import { StoreTarget, LoadSource } from "@guildofweavers/air-assembly";

// LOAD SOURCE
// ================================================================================================
const sources: { [index: string]: LoadSource } = {
    'load.const'    : 'const',
    'load.trace'    : 'trace',
    'load.static'   : 'static',
    'load.input'    : 'input',
    'load.local'    : 'local',
};

export function getLoadSource(operation: string): LoadSource {
    const source = sources[operation];
    if (!source) {
        throw new Error(`${operation} is not a valid load operation`);
    }
    return source;
}

// STORE TARGET
// ================================================================================================
const targets: { [index: string]: StoreTarget } = {
    'store.local': 'local'
};

export function getStoreTarget(operation: string): StoreTarget {
    const target = targets[operation];
    if (!target) {
        throw new Error(`${operation} is not a valid store operation`);
    }
    return target;
}

// DIMENSIONS
// ================================================================================================
export type Dimensions = [number, number];
export namespace Dimensions {

    export function scalar(): Dimensions {
        return [0, 0];
    }

    export function vector(length: number): Dimensions {
        return [length, 0];
    }

    export function matrix(rows: number, columns: number): Dimensions {
        return [rows, columns];
    }

    export function isScalar(dimensions: Dimensions): boolean {
        return (dimensions[0] === 0 && dimensions[1] === 0);
    }

    export function isVector(dimensions: Dimensions): boolean {
        return (dimensions[0] > 0 && dimensions[1] === 0);
    }

    export function isMatrix(dimensions: Dimensions): boolean {
        return (dimensions[1] > 0);
    }

    export function areSameDimensions(d1: Dimensions, d2: Dimensions): boolean {
        return d1[0] === d2[0] && d1[1] === d2[1];
    }
}

// DEGREE
// ================================================================================================
export type ExpressionDegree = bigint | bigint[] | bigint[][];
export interface DegreeOp {
    (d1: bigint, d2: bigint): bigint;
}

export function maxDegree(d1: ExpressionDegree, d2: ExpressionDegree): ExpressionDegree {
    if (typeof d1 === 'bigint') {
        if (typeof d2 !== 'bigint') throw new Error('cannot infer max degree');
        return (d1 > d2 ? d1 : d2);
    }
    else if (typeof d1[0] === 'bigint') {
        return vectorDegree((a, b) => (a > b ? a : b), d1 as bigint[], d2 as bigint | bigint[]);
    }
    else {
        return matrixDegree((a, b) => (a > b ? a : b), d1 as bigint[][], d2 as bigint | bigint[][]);
    }
}

export function sumDegree(d1: ExpressionDegree, d2: ExpressionDegree): ExpressionDegree {
    if (typeof d1 === 'bigint') {
        if (typeof d2 !== 'bigint') throw new Error('cannot infer sum degree');
        return d1 + d2;
    }
    else if (typeof d1[0] === 'bigint') {
        return vectorDegree((a, b) => (a + b), d1 as bigint[], d2 as bigint | bigint[]);
    }
    else {
        return matrixDegree((a, b) => (a + b), d1 as bigint[][], d2 as bigint | bigint[][]);
    }
}

export function mulDegree(d1: ExpressionDegree, d2: ExpressionDegree): ExpressionDegree {
    if (typeof d1 === 'bigint') {
        if (typeof d2 !== 'bigint') throw new Error('cannot infer mul degree');
        return d1 * d2;
    }
    else if (typeof d1[0] === 'bigint') {
        return vectorDegree((a, b) => (a * b), d1 as bigint[], d2 as bigint | bigint[]);
    }
    else {
        return matrixDegree((a, b) => (a * b), d1 as bigint[][], d2 as bigint | bigint[][]);
    }
}

export function linearCombinationDegree(d1: bigint[], d2: bigint[]): bigint {
    let result = 0n;
    for (let i = 0; i < d1.length; i++) {
        let d = d1[i] + d2[i];
        if (d > result) { result = d; }
    }
    return result;
}

export function matrixVectorProductDegree(d1: bigint[][], d2: bigint[]): bigint[] {
    const result = new Array<bigint>();
    for (let row of d1) {
        result.push(linearCombinationDegree(row, d2));
    }
    return result;
}

export function matrixMatrixProductDegree(d1: bigint[][], d2: bigint[][]): bigint[][] {
    const n = d1.length;
    const m = d1[0].length;
    const p = d2[0].length;

    const result = new Array<bigint[]>(n);
    for (let i = 0; i < n; i++) {
        let row = result[i] = new Array<bigint>(p);
        for (let j = 0; j < p; j++) {
            let s = 0n;
            for (let k = 0; k < m; k++) {
                let d = d1[i][k] + d2[k][j];
                if (d > s) { s = d };
            }
            row[j] = s;
        }
    }
    return result;
}

export function degreeToDimensions(degree: ExpressionDegree): Dimensions {
    if (typeof degree === 'bigint') {
        // degree describes a scalar
        return [0, 0];
    }

    if (!Array.isArray(degree)) throw new Error(`degree '${degree}' is invalid`);
    if (degree.length === 0) throw new Error(`degree '${degree}' is invalid`);

    if (typeof degree[0] === 'bigint') {
        // degree describes a vector
        return [degree.length, 0];
    }

    let colCount = 0;
    for (let row of degree) {
        if (!Array.isArray(row)) throw new Error(`degree '${degree}' is invalid`);
        if (!colCount)
            colCount = row.length;
        else if (colCount !== row.length)
            throw new Error(`degree '${degree}' is invalid`);
    }

    if (!colCount) throw new Error(`degree '${degree}' is invalid`);

    // degree describes a matrix
    return [degree.length, colCount];
}

// HELPER FUNCTIONS
// ================================================================================================
function vectorDegree(op: DegreeOp, d1: bigint[], d2: bigint[] | bigint): bigint[] {
    const result = new Array<bigint>(d1.length);
    for (let i = 0; i < d1.length; i++) {
        let v2 = (typeof d2 === 'bigint'? d2 : d2[i]);
        result[i] = op(d1[i], v2);
    }
    return result;
}

function matrixDegree(op: DegreeOp, d1: bigint[][], d2: bigint[][] | bigint) {
    const result = new Array<bigint[]>(d1.length);
    for (let i = 0; i < d1.length; i++) {
        result[i] = new Array<bigint>(d1[i].length);
        for (let j = 0; j < d1[i].length; j++) {
            let v2 = (typeof d2 === 'bigint'? d2 : d2[i][j]);
            result[i][j] = op(d1[i][j], v2);
        }
    }
    return result;
}