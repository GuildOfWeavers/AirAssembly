// IMPORTS
// ================================================================================================
import { MaskRegister as IMaskRegister } from '@guildofweavers/air-assembly';
import { StaticRegister } from "./StaticRegister";

// CLASS DEFINITION
// ================================================================================================
export class MaskRegister extends StaticRegister implements IMaskRegister {

    readonly source     : number;
    readonly inverted   : boolean;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(source: number, inverted: boolean) {
        super();
        this.source = source;
        this.inverted = inverted;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return `(mask (input ${this.source}))`;
    }
}