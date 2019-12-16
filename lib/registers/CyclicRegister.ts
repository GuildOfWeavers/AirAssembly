// IMPORTS
// ================================================================================================
import { CyclicRegister as ICyclicRegister } from '@guildofweavers/air-assembly';
import { FiniteField } from "@guildofweavers/galois";
import { StaticRegister } from "./StaticRegister";
import { PrngSequence } from "./PrngSequence";
import { validate, isPowerOf2 } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class CyclicRegister extends StaticRegister implements ICyclicRegister {

    readonly field  : FiniteField;
    readonly values : bigint[] | PrngSequence;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values: bigint[] | PrngSequence, field: FiniteField) {
        super();
        validate(values.length > 1, errors.valueLengthSmallerThan2());
        validate(isPowerOf2(values.length), errors.valueLengthNotPowerOf2());
        if (Array.isArray(values)) {
            values.forEach(v => validate(field.isElement(v), errors.valueNotFieldElement(v)));
        }
        this.values = values;
        this.field = field;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get cycleLength(): number {
        return this.values.length;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getValues(): bigint[] {
        if (this.values instanceof PrngSequence) {
            return this.values.getValues(this.field);
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
    valueNotFieldElement    : (v: bigint) => `${v} is not a valid field element`,
    valueLengthNotPowerOf2  : () => `number of values in a cyclic register must be a power of 2`,
    valueLengthSmallerThan2 : () => `number of values in a cyclic register must be greater than 1`
};