// IMPORTS
// ================================================================================================
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

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return this.value.toString();
    }
}