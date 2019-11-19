// IMPORTS
// ================================================================================================
import { Subroutine as ISubroutine } from "@guildofweavers/air-assembly";
import { Expression, Dimensions, ExpressionTransformer } from '../expressions';

// CLASS DEFINITION
// ================================================================================================
export class Subroutine implements ISubroutine {
    
    private _expression     : Expression;
    private _localVarIdx    : number;

    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(expression: Expression, localVarIdx: number) {
        this._expression = expression;
        this._localVarIdx = localVarIdx;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get expression(): Expression {
        return this._expression;
    }

    get localVarIdx(): number {
        return this._localVarIdx;
    }

    get dimensions(): Dimensions {
        return this._expression.dimensions;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    updateIndex(fromIdx: number, toIdx: number): void {
        if (this.localVarIdx === fromIdx) {
            this._localVarIdx = toIdx;
        }
    }

    transformExpression(transformer: ExpressionTransformer): void {
        let transformed = transformer(this.expression);
        if (transformed === this.expression) {
            this.expression.transform(transformer);
        }
        else {
            this._expression = transformed;
        }
    }

    toString() {
        return `(store.local ${this.localVarIdx} ${this.expression.toString()})`;
    }
}