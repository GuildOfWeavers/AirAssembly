// IMPORTS
// ================================================================================================
import { StaticRegister } from "./StaticRegister";
import { FiniteField } from "@guildofweavers/galois";
import { PrngSequence } from "./PrngSequence";

// CLASS DEFINITION
// ================================================================================================
export class CyclicRegister extends StaticRegister {

    readonly values: bigint[] | PrngSequence;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values: bigint[] | PrngSequence) {
        super();    
        this.values = values;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getValues(field: FiniteField): bigint[] {
        if (this.values instanceof PrngSequence) {
            return this.values.getValues(field);
        }
        else {
            return this.values;
        }
    }

    toString(): string {
        const values = (this.values instanceof PrngSequence)
            ? this.values.toString()
            : this.values.join(' ');
        return `(cycle ${values})`;
    }
}