// IMPORTS
// ================================================================================================
import { FiniteField } from '@guildofweavers/galois';

// CLASS DEFINITION
// ================================================================================================
export class PowerSequence {

    readonly base   : bigint;
    readonly length : number;

    private _values?: bigint[];

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(base: bigint, count: number) {
        this.base = base;
        this.length = count;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getValues(field: FiniteField): bigint[] {
        if (!this._values) {
            this._values = [];
            for (let i = 0; i < this.length; i++) {
                this._values.push(field.exp(this.base, BigInt(i)));
            }
        }
        return this._values;
    }

    toString(): string {
        return `(power ${this.base} ${this.length})`;
    }
}