// IMPORTS
// ================================================================================================
import { StoreOperation as IStoreOperation } from "@guildofweavers/air-assembly";
import { Expression, Dimensions } from '../expressions';

// CLASS DEFINITION
// ================================================================================================
export class StoreOperation implements IStoreOperation {
    
    private _target     : number;
    private _expression : Expression;

    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(target: number, expression: Expression) {
        this._target = target;
        this._expression = expression;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get target(): number {
        return this._target;
    }
    get expression(): Expression {
        return this._expression;
    }

    get dimensions(): Dimensions {
        return this._expression.dimensions;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(store.local ${this.target} ${this.expression.toString()})`;
    }
}