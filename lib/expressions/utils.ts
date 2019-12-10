// IMPORTS
// ================================================================================================
import { StoreTarget, LoadSource } from "@guildofweavers/air-assembly";

// LOAD SOURCE
// ================================================================================================
const sources: { [index: string]: LoadSource } = {
    'load.const'    : 'const',
    'load.trace'    : 'trace',
    'load.static'   : 'static',
    'load.param'    : 'param',
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