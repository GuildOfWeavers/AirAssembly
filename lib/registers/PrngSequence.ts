// IMPORTS
// ================================================================================================
import { FiniteField } from '@guildofweavers/galois';
import { sha256prng } from '../utils';

// CLASS DEFINITION
// ================================================================================================
export class PrngSequence {

    readonly method : 'sha256';
    readonly seed   : Buffer;
    readonly length : number;

    private _values?: bigint[];

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(method: string, seed: bigint, count: number) {
        if (method !== 'sha256') throw new Error(`prng method: '${method}' is not supported`);
        this.method = method;
        this.seed = Buffer.from(seed.toString(16).padStart(2, '0'), 'hex');
        this.length = count;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getValues(field: FiniteField): bigint[] {
        if (!this._values) {
            this._values = sha256prng(this.seed, this.length, field);
        }
        return this._values;
    }

    toString(): string {
        return `(prng ${this.method} 0x${this.seed.toString('hex')} ${this.length})`;
    }
}