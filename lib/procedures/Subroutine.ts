// IMPORTS
// ================================================================================================
import { StoreTarget, Dimensions, ExpressionDegree } from "@guildofweavers/air-assembly";
import { Expression } from "../expressions";

// CLASS DEFINITION
// ================================================================================================
export class Subroutine {
    
    readonly expression : Expression;
    readonly localIndex : number;

    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(expression: Expression, localIndex: number) {
        this.expression = expression;
        this.localIndex = localIndex;
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
        return `(store.local ${this.localIndex} ${this.expression.toString()})`;
    }
}