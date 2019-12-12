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
        return this.value.toString();
    }
}