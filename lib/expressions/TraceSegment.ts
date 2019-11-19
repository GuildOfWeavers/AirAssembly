// IMPORTS
// ================================================================================================
import { Expression } from "./Expression";
import { Dimensions } from "./utils";

// TODO: rename

// CLASS DEFINITION
// ================================================================================================
export class TraceSegment extends Expression {

    readonly segment: 'trace' | 'static'

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(segment: 'trace' | 'static', width: number) {
        super(Dimensions.vector(width));
        this.segment = segment;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return this.segment;
    }
}