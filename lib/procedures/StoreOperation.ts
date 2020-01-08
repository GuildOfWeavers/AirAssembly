// IMPORTS
// ================================================================================================
import { StoreOperation as IStoreOperation } from "@guildofweavers/air-assembly";
import { Expression, Dimensions } from '../expressions';

// CLASS DEFINITION
// ================================================================================================
export class StoreOperation implements IStoreOperation {
    
    private _target     : number;
    private _handle?    : string;
    private _expression : Expression;

    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(target: number, expression: Expression, handle?: string) {
        this._target = target;
        this._handle = handle;
        this._expression = expression;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get target(): number {
        return this._target;
    }

    get handle(): string | undefined {
        return this._handle;
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
        const target = this._handle ? this._handle : this.target;
        return `(store.local ${target} ${this.expression.toString()})`;
    }
}