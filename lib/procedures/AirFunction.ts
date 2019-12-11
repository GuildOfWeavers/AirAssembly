// IMPORTS
// ================================================================================================
import { FiniteField } from '@guildofweavers/air-assembly';
import { Expression, LoadExpression, LiteralValue, TraceSegment, ExpressionTransformer } from "../expressions";
import { Dimensions, getLoadSource } from "../expressions/utils";
import { LocalVariable } from "./LocalVariable";
import { StoreOperation } from './StoreOperation';
import { Parameter } from './Parameter';
import { ExecutionContext } from './contexts/ExecutionContext';

// CLASS DEFINITION
// ================================================================================================
export class AirFunction {

    readonly dimensions         : Dimensions;
    readonly context            : ExecutionContext;

    readonly assignments        : StoreOperation[];
    private _result?            : Expression;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(width: number, context: ExecutionContext) {
        this.dimensions = Dimensions.vector(width);
        this.context = context;
        this.assignments = [];
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get result(): Expression {
        return this._result!; // TODO
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    addAssignment(): void {
        // TODO
    }

    toString(): string {
        return ''; // TODO
    }

    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    
}

