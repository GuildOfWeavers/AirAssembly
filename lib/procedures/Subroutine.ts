// IMPORTS
// ================================================================================================
import { Subroutine as ISubroutine } from "@guildofweavers/air-assembly";
import { Expression, Dimensions } from '../expressions';

// CLASS DEFINITION
// ================================================================================================
export class Subroutine implements ISubroutine {
    
    readonly expression     : Expression;
    readonly localVarIdx    : number;

    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(expression: Expression, localVarIdx: number) {
        this.expression = expression;
        this.localVarIdx = localVarIdx;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get dimensions(): Dimensions {
        return this.expression.dimensions;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(store.local ${this.localVarIdx} ${this.expression.toString()})`;
    }
}