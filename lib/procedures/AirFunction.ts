// IMPORTS
// ================================================================================================
import { AirFunction as IAirFunction } from '@guildofweavers/air-assembly';
import { FunctionContext } from './contexts/FunctionContext';
import { Parameter } from './Parameter';
import { LocalVariable } from "./LocalVariable";
import { StoreOperation } from './StoreOperation';
import { Expression, Dimensions } from "../expressions";
import { validateHandle } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class AirFunction implements IAirFunction {

    readonly params         : Parameter[];
    readonly locals         : LocalVariable[];

    readonly statements     : StoreOperation[];
    readonly result         : Expression;

    readonly handle?        : string;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(context: FunctionContext, statements: StoreOperation[], result: Expression, handle?: string) {
        this.params = context.params.slice();
        this.locals = context.locals.slice();
        this.statements = statements.slice();

        if (!result.isVector || !Dimensions.areSameDimensions(result.dimensions, context.result))
            throw new Error(`function must resolve to a ${Dimensions.toString(context.result)} value`);
        this.result = result;
        
        if (handle !== undefined) {
            this.handle = validateHandle(handle);
        }
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get dimensions(): Dimensions {
        return this.result.dimensions;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        let code = `\n    (result ${Dimensions.toExpressionString(this.dimensions)})`;
        if (this.params.length > 0)
            code += `\n    ${this.params.map(p => p.toString()).join(' ')}`;
        if (this.locals.length > 0)
            code += `\n    ${this.locals.map(v => v.toString()).join(' ')}`;
        if (this.statements.length > 0)
            code += `\n    ${this.statements.map(s => s.toString()).join('\n    ')}`;
        code += `\n    ${this.result.toString()}`

        const handle = this.handle ? ` ${this.handle}` : '';
        return `(function${handle}${code})`;
    }
}