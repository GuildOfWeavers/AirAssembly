// IMPORTS
// ================================================================================================
import { StoreTarget } from '@guildofweavers/air-assembly';
import { Expression } from './Expression';
import { getStoreTarget } from './utils';

// CLASS DEFINITION
// ================================================================================================
export class StoreExpression extends Expression {

    private _index  : number;
    readonly target : StoreTarget;
    readonly value  : Expression;

    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(operation: string, index: number, value: Expression) {
        super(value.dimensions, value.degree);
        this.target = getStoreTarget(operation);
        this._index = index;
        this.value = value;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get index(): number {
        return this._index;
    }

    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    updateAccessorIndex(target: StoreTarget, fromIdx: number, toIdx: number): void {
        if (this.target === target && this._index === fromIdx) {
            this._index = toIdx;
        }
    }

    toString(): string {
        return `(store.${this.target} ${this.index} ${this.value.toString()})`;
    }
}