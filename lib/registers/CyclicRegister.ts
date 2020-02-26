// IMPORTS
// ================================================================================================
import { CyclicRegister as ICyclicRegister, ValueSequence } from '@guildofweavers/air-assembly';
import { FiniteField } from '@guildofweavers/galois';
import { StaticRegister } from './StaticRegister';
import { validate, isPowerOf2 } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class CyclicRegister extends StaticRegister implements ICyclicRegister {

    readonly field  : FiniteField;
    readonly values : bigint[] | ValueSequence;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values: bigint[] | ValueSequence, field: FiniteField) {
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
        if (Array.isArray(this.values)) {
            return this.values;
        }
        else {
            return this.values.getValues(this.field);
        }
    }

    toString(): string {

        const values = (Array.isArray(this.values))
            ? this.values.join(' ')
            : this.values.toString();
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