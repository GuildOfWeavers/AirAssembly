// IMPORTS
// ================================================================================================
import { FiniteField } from '@guildofweavers/galois';
import { Expression } from './Expression';
import { Dimensions } from './utils';
import { validate } from '../utils';

// CLASS DEFINITION
// ================================================================================================
export class LiteralValue extends Expression {

    readonly value: bigint | bigint[] | bigint[][];

    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(value: bigint | bigint[] | bigint[][], field: FiniteField) {
        if (typeof value === 'bigint') {
            // value is a scalar
            super(Dimensions.scalar());
            validate(field.isElement(value), errors.invalidFieldElement(value));
        }
        else if (Array.isArray(value)) {
            // value is a vector or a matrix
            const rowCount = value.length;

            if (isBigIntArray(value)) {
                // value is a vector
                super(Dimensions.vector(rowCount));
                value.forEach(v => validate(field.isElement(v), errors.invalidFieldElement(v)));
            }
            else {
                // value is a matrix
                const colCount = value[0].length;
                super(Dimensions.matrix(rowCount, colCount));
                for (let row of value) {
                    validate(row.length === colCount, errors.inconsistentMatrix());
                    row.forEach(v => validate(field.isElement(v), errors.invalidFieldElement(v)));
                }
            }
        }
        else {
            throw new Error(`invalid literal value '${value}'`);
        }

        this.value = value;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get isStatic(): boolean {
        return true;
    }

    get elements(): bigint[] {
        if (this.isScalar) return [this.value as bigint];
        else if (this.isVector) return this.value as bigint[];
        else {
            let elements: bigint[] = [];
            for (let row of (this.value as bigint[][])) {
                elements = elements.concat(row);
            }
            return elements;
        }
    }

    // PUBLIC METHODS
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

// HELPER FUNCTIONS
// ================================================================================================
function isBigIntArray(value: any[]): value is bigint[] {
    return typeof value[0] === 'bigint';
}

// ERRORS
// ================================================================================================
const errors = {
    invalidFieldElement: (v: bigint) => `${v} is not a valid field element`,
    inconsistentMatrix : () => `all matrix rows must have the same number of columns`
};