// IMPORTS
// ================================================================================================
import * as crypto from 'crypto';
import { FiniteField } from "@guildofweavers/galois";
import { AirComponent } from './AirComponent';

// CONSTANTS
// ================================================================================================
const MAX_HANDLE_LENGTH = 128;
const HANDLE_REGEXP = /\$[_a-zA-Z]\w*/g;

// PUBLIC FUNCTIONS
// ================================================================================================
export function isPowerOf2(value: number | bigint): boolean {
    if (typeof value === 'bigint') {
        return (value !== 0n) && (value & (value - 1n)) === 0n;
    }
    else {
        return (value !== 0) && (value & (value - 1)) === 0;
    }
}

export function getCompositionFactor(component: AirComponent): number {
    return 2**Math.ceil(Math.log2(component.maxConstraintDegree));
}

// VALIDATORS
// ================================================================================================
export function validate(condition: any, errorMessage: string): asserts condition {
    if (!condition) throw new Error(errorMessage);
}

export function validateHandle(handle: string): string {
    validate(handle.length <= MAX_HANDLE_LENGTH, `handle '${handle}' is invalid: handle length cannot exceed ${MAX_HANDLE_LENGTH} characters`);
    const matches = handle.match(HANDLE_REGEXP);
    validate(matches !== null && matches.length === 1, `handle '${handle}' is invalid`);
    return handle;
}

// PRNG FUNCTIONS
// ================================================================================================
export function sha256prng(seed: Buffer, count: number, field: FiniteField): bigint[] {
    const values: bigint[] = [];
    const vSeed = Buffer.concat([Buffer.from([0, 0]), seed]);
    for (let i = 0; i < count; i++) {
        vSeed.writeUInt16BE(i + 1, 0);
        let value = crypto.createHash('sha256').update(vSeed).digest();
        values[i] = field.add(BigInt(`0x${value.toString('hex')}`), 0n);
    }
    return values;
}