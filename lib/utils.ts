// IMPORTS
// ================================================================================================
import * as crypto from 'crypto';
import { AirSchema } from "./AirSchema";
import { FiniteField } from "@guildofweavers/galois";

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

export function getCompositionFactor(schema: AirSchema): number {
    return 2**Math.ceil(Math.log2(schema.maxConstraintDegree));
}

export function validateHandle(handle: string): string {
    // TODO: implement
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