// IMPORTS
// ================================================================================================
import { StaticRegister } from "./StaticRegister";

// CLASS DEFINITION
// ================================================================================================
export class CyclicRegister extends StaticRegister {

    readonly values: bigint[];

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values: bigint[]) {
        super();    
        // make sure the length of values is at least 4; this is needed for FFT interpolation
        while (values.length < 4) values = values.concat(values);
        this.values = values;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return `(cycle ${this.values.join(' ')})`;
    }
}