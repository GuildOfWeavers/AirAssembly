// IMPORTS
// ================================================================================================
import { MaskRegister as IMaskRegister } from "@guildofweavers/air-assembly";

// CLASS DEFINITION
// ================================================================================================
export class MaskRegister implements IMaskRegister {

    readonly index      : number;
    readonly source     : number;
    readonly value      : bigint;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(index: number, source: number, value: bigint) {
        this.index = index;
        this.source = source;
        this.value = value;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get type(): 'mask' {
        return 'mask';
    }

    get secret(): boolean {
        return false;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return `(mask (input ${this.source}) (value ${this.value}))`;
    }
}