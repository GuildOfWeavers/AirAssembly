// IMPORTS
// ================================================================================================
import { FiniteField } from "@guildofweavers/galois";
import { LiteralValue, Dimensions } from "../expressions";
import { validateHandle } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class Constant {

    readonly value      : LiteralValue;
    readonly handle?    : string;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(value: LiteralValue, handle?: string) {
        this.value = value;
        if (handle !== undefined) {
            this.handle = validateHandle(handle);
        }
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get dimensions(): Dimensions {
        return this.value.dimensions;
    }

    get isScalar(): boolean {
        return this.value.isScalar;
    }

    get isVector(): boolean {
        return this.value.isVector;
    }

    get isMatrix(): boolean {
        return this.value.isMatrix;
    }

    get isStatic(): boolean {
        return true;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    validate(field: FiniteField): void {
        for (let element of this.value.elements) {
            if (!field.isElement(element)) {
                throw new Error(`constant value ${element} is not a valid field element`);
            }
        }
    }

    toString(): string {
        const handle = this.handle ? ` ${this.handle} ` : ' ';
        if (this.isScalar) {
            return `(const${handle}scalar ${this.value.value})`;
        }
        else if (this.isVector) {
            return `(const${handle}vector ${(this.value.value as bigint[]).join(' ')})`;
        }
        else {
            const rows = (this.value.value as bigint[][]).map(r => `(${r.join(' ')})`);
            return `(const${handle}matrix ${rows.join(' ')})`;
        }
    }
}