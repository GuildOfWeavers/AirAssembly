// IMPORTS
// ================================================================================================
import * as crypto from 'crypto';
import { FiniteField } from '@guildofweavers/galois';

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
        this.seed = Buffer.from(seed.toString(16), 'hex');
        this.length = count;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getValues(field: FiniteField): bigint[] {
        if (!this._values) {
            this._values = generateValues(field, this.method, this.seed, this.length);
        }
        return this._values;
    }

    toString(): string {
        return `(prng ${this.method} 0x${this.seed.toString('hex')} ${this.length})`;
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function generateValues(field: FiniteField, method: string, seed: Buffer, count: number): bigint[] {
    const values: bigint[] = [];
    const vSeed = Buffer.concat([Buffer.from([0, 0]), seed]);
    if (method === 'sha256') {
        for (let i = 0; i < count; i++) {
            vSeed.writeUInt16BE(i + 1, 0);
            let value = crypto.createHash('sha256').update(vSeed).digest();
            values[i] = field.add(BigInt(`0x${value.toString('hex')}`), 0n);
        }
    }
    else {
        throw new Error(`'${method}' is not a valid prng method`);
    }

    return values;
}