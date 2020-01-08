// IMPORTS
// ================================================================================================
import { LoadSource } from '@guildofweavers/air-assembly';
import { Expression } from './Expression';
import { TraceSegment } from './TraceSegment';
import { StoreOperation, Parameter, Constant } from '../procedures';

// INTERFACES
// ================================================================================================
type LoadBinding = Constant | TraceSegment | StoreOperation | Parameter;

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
        if (this.binding instanceof Constant) return 'const';
        else if (this.binding instanceof Parameter) return 'param';
        else if (this.binding instanceof StoreOperation) return 'local';
        else if (this.binding instanceof TraceSegment) return this.binding.segment;
        else throw new Error(`invalid load binding: ${this.binding}`);
    }

    get isStatic(): boolean {
        if (this.binding instanceof Constant) return true;
        else if (this.binding instanceof Parameter) return false;
        else if (this.binding instanceof StoreOperation) return this.binding.expression.isStatic;
        else if (this.binding instanceof TraceSegment) return false;
        else throw new Error(`invalid load binding: ${this.binding}`);
    }

    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        if ((this.binding instanceof Constant || this.binding instanceof Parameter) && this.binding.handle) {
            return `(load.${this.source} ${this.binding.handle})`;
        }
        else {
            return `(load.${this.source} ${this.index})`;
        }
    }
}