// IMPORTS
// ================================================================================================
import { AirProcedure as IProcedure, ProcedureName} from '@guildofweavers/air-assembly';
import { ProcedureContext } from './contexts/ProcedureContext';
import { Expression, TraceSegment } from "../expressions";
import { Constant } from './Constant';
import { Parameter } from './Parameter';
import { LocalVariable } from "./LocalVariable";
import { StoreOperation } from './StoreOperation';
import { Dimensions } from "../expressions/utils";

// CLASS DEFINITION
// ================================================================================================
export class AirProcedure implements IProcedure {

    readonly name               : ProcedureName;
    readonly params             : ReadonlyArray<Parameter>;
    readonly locals             : ReadonlyArray<LocalVariable>;

    readonly statements         : ReadonlyArray<StoreOperation>;
    readonly result             : Expression;

    readonly constants          : ReadonlyArray<Constant>;
    readonly traceRegisters     : TraceSegment;
    readonly staticRegisters    : TraceSegment;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(context: ProcedureContext, statements: StoreOperation[], result: Expression) {
        this.name = context.name;
        this.params = context.params.slice();
        this.locals = context.locals.slice();
        this.statements = statements.slice();
        if (!result.isVector || result.dimensions[0] !== context.width)
            throw new Error(`${this.name} procedure must resolve to a vector of ${context.width} elements`);
        this.result = result;
        this.constants = context.constants;
        this.traceRegisters = context.traceRegisters;
        this.staticRegisters = context.staticRegisters;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get dimensions(): Dimensions {
        return this.result.dimensions;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        let code = ``;
        if (this.params.length > 0)
            code += `\n      ${this.params.map(v => v.toString()).join(' ')}`;
        if (this.locals.length > 0)
            code += `\n      ${this.locals.map(v => v.toString()).join(' ')}`;
        if (this.statements.length > 0)
            code += `\n      ${this.statements.map(s => s.toString()).join('\n      ')}`;
        code += `\n      ${this.result.toString()}`
        return `\n    (${this.name}${code})`;
    }
}