// IMPORTS
// ================================================================================================
import { AirSchema } from "@guildofweavers/air-assembly";

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