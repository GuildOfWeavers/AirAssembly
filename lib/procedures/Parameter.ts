// IMPORTS
// ================================================================================================
import { Parameter as IParameter } from '@guildofweavers/air-assembly';
import { Dimensions } from "../expressions/utils";
import { validateHandle } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class Parameter implements IParameter {

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
        return `(param${handle}${Dimensions.toExpressionString(this.dimensions)})`;
    }
}