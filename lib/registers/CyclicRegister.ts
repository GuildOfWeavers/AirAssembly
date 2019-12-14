// IMPORTS
// ================================================================================================
import { StaticRegister } from "./StaticRegister";
import { FiniteField } from "@guildofweavers/galois";
import { PrngSequence } from "./PrngSequence";
import { validate, isPowerOf2 } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class CyclicRegister extends StaticRegister {

    readonly values: bigint[] | PrngSequence;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values: bigint[] | PrngSequence) {
        super();
        validate(values.length > 1, errors.valueLengthSmallerThan2());
        validate(isPowerOf2(values.length), errors.valueLengthNotPowerOf2());
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

// ERRORS
// ================================================================================================
const errors = {
    valueLengthNotPowerOf2  : () => `number of values in a cyclic register must be a power of 2`,
    valueLengthSmallerThan2 : () => `number of values in a cyclic register must be greater than 1`
};