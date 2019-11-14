// IMPORTS
// ================================================================================================
import { CyclicRegister as ICyclicRegister } from "@guildofweavers/air-assembly";
import { isPowerOf2 } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class CyclicRegister implements ICyclicRegister {

    readonly index      : number;
    readonly values     : bigint[];

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(index: number, values: bigint[]) {
        if (!isPowerOf2(values.length))
            throw new Error(`number of values in a cyclic register must be a power of 2, but ${values.length} values provided`);
        
        this.index = index;
        this.values = values;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get type(): 'cyclic' {
        return 'cyclic';
    }

    get secret(): boolean {
        return false;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return `(cycle ${this.values.join(' ')})`;
    }
}