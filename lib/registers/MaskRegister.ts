// IMPORTS
// ================================================================================================
import { StaticRegister } from "./StaticRegister";

// CLASS DEFINITION
// ================================================================================================
export class MaskRegister extends StaticRegister {

    readonly source     : number;
    readonly value      : bigint;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(source: number, value: bigint) {
        super();
        this.source = source;
        this.value = value;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return `(mask (input ${this.source}) (value ${this.value}))`;
    }
}