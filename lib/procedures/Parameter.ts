// IMPORTS
// ================================================================================================
import { Dimensions } from "../expressions/utils";
import { validateHandle } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class Parameter {

    readonly dimensions : Dimensions;
    readonly handle?    : string;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(dimensions: Dimensions, handle?: string) {
        this.dimensions = dimensions;
        if (handle !== undefined) {
            this.handle = validateHandle(handle);
        }
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        const handle = this.handle ? ` ${this.handle} ` : ' ';

        if (Dimensions.isScalar(this.dimensions))
            return `(param${handle}scalar)`;
        else if (Dimensions.isVector(this.dimensions))
            return `(param${handle}vector ${this.dimensions[0]})`;
        else
            return `(param${handle}matrix ${this.dimensions[0]} ${this.dimensions[1]})`;
    }
}