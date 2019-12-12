// IMPORTS
// ================================================================================================
import { FunctionContext } from './contexts/FunctionContext';
import { Parameter } from './Parameter';
import { LocalVariable } from "./LocalVariable";
import { StoreOperation } from './StoreOperation';
import { Expression } from "../expressions";
import { Dimensions } from "../expressions/utils";
import { validateHandle } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class AirFunction {

    readonly parameters         : Parameter[];
    readonly localVariables     : LocalVariable[];

    readonly statements         : StoreOperation[];
    readonly result             : Expression;

    readonly handle?            : string;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(context: FunctionContext, statements: StoreOperation[], result: Expression, handle?: string) {
        this.parameters = context.parameters.slice();
        this.localVariables = context.locals.slice();
        this.statements = statements.slice();
        if (!result.isVector || result.dimensions[0] !== context.width)
            throw new Error(`function must resolve to a vector of ${context.width} elements`);
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

    get locals(): ReadonlyArray<Dimensions> {
        return this.localVariables.map(v => v.dimensions);
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        let code = `\n    (result ${Dimensions.toTypeString(this.dimensions)})`;
        if (this.parameters.length > 0)
            code += `\n    ${this.parameters.map(p => p.toString()).join(' ')}`;
        if (this.localVariables.length > 0)
            code += `\n    ${this.localVariables.map(v => v.toString()).join(' ')}`;
        if (this.statements.length > 0)
            code += `\n    ${this.statements.map(s => s.toString()).join('\n    ')}`;
        code += `\n    ${this.result.toString()}`

        const handle = this.handle ? ` ${this.handle}` : '';
        return `(function${handle}${code})`;
    }

    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    
}