// IMPORTS
// ================================================================================================
import { LoadSource } from '@guildofweavers/air-assembly';
import { Expression } from './Expression';
import { LiteralValue } from './LiteralValue';
import { TraceSegment } from './TraceSegment';
import { Subroutine, Parameter } from '../procedures';

// INTERFACES
// ================================================================================================
type LoadBinding = TraceSegment | LiteralValue | Subroutine | Parameter;

// CLASS DEFINITION
// ================================================================================================
export class LoadExpression extends Expression {

    readonly index  : number;
    readonly binding: LoadBinding;

    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(binding: LoadBinding, index: number) {
        super(binding.dimensions);
        this.index = index;
        this.binding = binding;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get source(): LoadSource {
        if (this.binding instanceof LiteralValue) return 'const';
        else if (this.binding instanceof Subroutine) return 'local';
        else if (this.binding instanceof TraceSegment) return this.binding.segment;
        else throw new Error(`invalid load binding: ${this.binding}`);
    }

    get isStatic(): boolean {
        if (this.binding instanceof LiteralValue) return true;
        else if (this.binding instanceof Subroutine) return this.binding.expression.isStatic;
        else if (this.binding instanceof TraceSegment) return false;
        else throw new Error(`invalid load binding: ${this.binding}`);
    }

    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return `(load.${this.source} ${this.index})`;
    }
}