// IMPORTS
// ================================================================================================
import { Expression } from './Expression';
import { Dimensions } from './utils';

// CLASS DEFINITION
// ================================================================================================
export class LiteralValue extends Expression {

    readonly value: bigint | bigint[] | bigint[][];

    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(value: bigint | bigint[] | bigint[][]) {
        if (typeof value === 'bigint') {
            // value is a scalar
            super(Dimensions.scalar());
        }
        else if (Array.isArray(value)) {
            // value is a vector or a matrix
            const rowCount = value.length;

            if (typeof value[0] === 'bigint') {
                // value is a vector
                super(Dimensions.vector(rowCount));
            }
            else {
                // value is a matrix
                const colCount = (value[0] as bigint[]).length;
                super(Dimensions.matrix(rowCount, colCount));
                for (let row of value as bigint[][]) {
                    if (row.length !== colCount) {
                        throw new Error(`all matrix rows must have the same number of columns`);
                    }
                }
            }
        }
        else {
            throw new Error(`invalid constant value '${value}'`);
        }

        this.value = value;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get isStatic(): boolean {
        return true;
    }

    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        if (this.isScalar) {
            return `(scalar ${this.value})`;
        }
        else if (this.isVector) {
            return `(vector ${(this.value as bigint[]).join(' ')})`;
        }
        else {
            const rows = (this.value as bigint[][]).map(r => `(${r.join(' ')})`);
            return `(matrix ${rows.join(' ')})`;
        }
    }
}