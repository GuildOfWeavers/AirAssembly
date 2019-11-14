// IMPORTS
// ================================================================================================
import { LoadSource } from '@guildofweavers/air-assembly';
import { Expression } from './Expression';
import { LiteralValue } from './LiteralValue';
import { StoreExpression } from './StoreExpression';
import { TraceSegment } from './TraceSegment';

// INTERFACES
// ================================================================================================
type LoadBinding = TraceSegment | LiteralValue | StoreExpression;

// CLASS DEFINITION
// ================================================================================================
export class LoadExpression extends Expression {

    private _index  : number;
    readonly binding: LoadBinding;

    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(binding: LoadBinding, index: number) {
        super(binding.dimensions, binding.degree);
        this._index = index;
        this.binding = binding;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get index(): number {
        return this._index;
    }

    get source(): LoadSource {
        if (this.binding instanceof LiteralValue) return 'const';
        if (this.binding instanceof StoreExpression) return 'local';
        else if (this.binding instanceof TraceSegment) return this.binding.segment;
        else throw new Error(`invalid load binding: ${this.binding}`);
    }

    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    collectLoadOperations(source: LoadSource, result: Map<Expression, Expression[]>): void {
        if (this.source === source) {
            const bindings = result.get(this.binding) || [];
            bindings.push(this);
            result.set(this.binding, bindings);
        }
    }

    updateAccessorIndex(source: LoadSource, fromIdx: number, toIdx: number): void {
        if (this.source === source && this._index === fromIdx) {
            this._index = toIdx;
        }
    }

    toString(): string {
        return `(load.${this.source} ${this.index})`;
    }
}