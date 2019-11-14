// IMPORTS
// ================================================================================================
import { isPowerOf2 } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class CyclicRegister {

    readonly values         : bigint[];

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values: bigint[]) {
        if (!isPowerOf2(values.length))
            throw new Error(`number of values in a cyclic register must be a power of 2, but ${values.length} values provided`);
        this.values = values;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return `(cycle ${this.values.join(' ')})`;
    }
}