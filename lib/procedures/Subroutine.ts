// IMPORTS
// ================================================================================================
import {
    Expression, Dimensions, ExpressionDegree, StoreTarget, Subroutine as ISubroutine
} from "@guildofweavers/air-assembly";


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

    get degree(): ExpressionDegree {
        return this.expression.degree;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    updateAccessorIndex(target: StoreTarget, fromIdx: number, toIdx: number): void {
        // TODO
        /*
        if (this.target === target && this._index === fromIdx) {
            this._index = toIdx;
        }
        */
    }

    toString() {
        return `(store.local ${this.localVarIdx} ${this.expression.toString()})`;
    }
}