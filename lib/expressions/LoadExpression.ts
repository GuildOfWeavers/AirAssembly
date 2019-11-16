// IMPORTS
// ================================================================================================
import { LoadSource } from '@guildofweavers/air-assembly';
import { Expression } from './Expression';
import { LiteralValue } from './LiteralValue';
import { TraceSegment } from './TraceSegment';
import { Subroutine } from '../procedures';

// INTERFACES
// ================================================================================================
type LoadBinding = TraceSegment | LiteralValue | Subroutine;

// CLASS DEFINITION
// ================================================================================================
export class LoadExpression extends Expression {

    private _index  : number;
    readonly binding: LoadBinding;

    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(binding: LoadBinding, index: number) {
        super(binding.dimensions);
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
        if (this.binding instanceof Subroutine) return 'local';
        else if (this.binding instanceof TraceSegment) return this.binding.segment;
        else throw new Error(`invalid load binding: ${this.binding}`);
    }

    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return `(load.${this.source} ${this.index})`;
    }
}