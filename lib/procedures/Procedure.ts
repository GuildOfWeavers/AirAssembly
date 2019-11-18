// IMPORTS
// ================================================================================================
import { Procedure as IProcedure, ProcedureName } from '@guildofweavers/air-assembly';
import { Expression, LoadExpression, LiteralValue, TraceSegment } from "../expressions";
import { Dimensions, getLoadSource } from "../expressions/utils";
import { Subroutine } from "./Subroutine";
import { LocalVariable } from "./LocalVariable";

// CLASS DEFINITION
// ================================================================================================
export class Procedure implements IProcedure {

    readonly name               : ProcedureName;
    readonly span               : number;
    readonly constants          : LiteralValue[];
    readonly localVariables     : LocalVariable[];
    readonly traceRegisters     : TraceSegment;
    readonly staticRegisters    : TraceSegment;
    readonly resultLength       : number;

    readonly subroutines        : Subroutine[];
    private _result?            : Expression;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(name: ProcedureName, span: number, width: number, constants: LiteralValue[], locals: Dimensions[], traceWidth: number, staticWidth: number) {
        this.name = name;
        this.span = validateSpan(name, span);
        this.constants = constants;
        this.localVariables = locals.map(d => new LocalVariable(d));
        this.traceRegisters = new TraceSegment(traceWidth, false);
        this.staticRegisters = new TraceSegment(staticWidth, true);
        this.resultLength = width;

        this.subroutines = [];
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get result(): Expression {
        if (!this._result) throw new Error(`${this.name} procedure result hasn't been set yet`);
        return this._result;
    }

    setResult(value: Expression): void {
        if (this._result) throw new Error(`${this.name} procedure result hasn't been set yet`);
        if (!value.isVector || value.dimensions[0] !== this.resultLength)
            throw new Error(`${this.name} procedure must resolve to a vector of ${this.resultLength} elements`);
        this._result = value;
    }

    get locals(): ReadonlyArray<Dimensions> {
        return this.localVariables.map(v => v.dimensions);
    }

    get expressions(): ReadonlyArray<Expression> {
        const expressions = this.subroutines.map(s => s.expression);
        expressions.push(this.result);
        return expressions;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    addSubroutine(expression: Expression, localIndex: number): void {
        // TODO: make sure subroutines can't be added after the result has been set?
        const variable = this.getLocalVariable(localIndex);
        const subroutine = new Subroutine(expression, localIndex)
        variable.bind(subroutine, localIndex);
        this.subroutines.push(subroutine);
    }

    buildLoadExpression(operation: string, index: number): LoadExpression {
        const source = getLoadSource(operation);
        if (source === 'const') {
            if (index >= this.constants.length)
                throw new Error(`constant with index ${index} has not been defined`);
            return new LoadExpression(this.constants[index], index);
        }
        else if (source === 'trace') {
            //TODO: this.validateFrameIndex(index);
            return new LoadExpression(this.traceRegisters, index);
        }
        else if (source === 'static') {
            //TODO: this.validateFrameIndex(index);
            if (!this.staticRegisters) throw new Error(`static registers have not been defined`);
            return new LoadExpression(this.staticRegisters, index);
        }
        else if (source === 'local') {
            const variable = this.getLocalVariable(index);
            const binding = variable.getBinding(index);
            return new LoadExpression(binding, index);
        }
        else {
            throw new Error(`${operation} is not a valid load operation`);
        }
    }

    toString() {
        let code = `\n    (span ${this.span}) (result vector ${this.resultLength})`;
        if (this.localVariables.length > 0)
            code += `\n    ${this.localVariables.map(v => v.toString()).join(' ')}`;
        if (this.subroutines.length > 0)
            code += `\n    ${this.subroutines.map(s => s.toString()).join('\n    ')}`;
        code += `\n    ${this.result.toString()}`
        return `\n  (${this.name}${code})`;
    }

    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    private getLocalVariable(index: number): LocalVariable {
        if (index >= this.localVariables.length)
            throw new Error(`local variable ${index} has not been defined`);
        return this.localVariables[index];
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function validateSpan(name: ProcedureName, span: number): number {
    if (name === 'transition') {
        if (span !== 1) throw new Error(`span ${span} is not valid for ${name} procedure`);
    }
    else if (name === 'evaluation') {
        if (span !== 2) throw new Error(`span ${span} is not valid for ${name} procedure`);
    }
    else {
        throw new Error(`invalid procedure name '${name}'`);
    }
    return span;
}