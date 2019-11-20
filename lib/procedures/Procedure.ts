// IMPORTS
// ================================================================================================
import { Procedure as IProcedure, ProcedureName, FiniteField } from '@guildofweavers/air-assembly';
import { Expression, LoadExpression, LiteralValue, TraceSegment, ExpressionTransformer } from "../expressions";
import { Dimensions, getLoadSource } from "../expressions/utils";
import { Subroutine } from "./Subroutine";
import { LocalVariable } from "./LocalVariable";

// CLASS DEFINITION
// ================================================================================================
export class Procedure implements IProcedure {

    readonly field              : FiniteField;
    readonly name               : ProcedureName;
    readonly span               : number;
    readonly resultLength       : number;
    readonly constants          : LiteralValue[];
    readonly localVariables     : LocalVariable[];
    readonly traceRegisters     : TraceSegment;
    readonly staticRegisters    : TraceSegment;

    readonly subroutines        : Subroutine[];
    private _result?            : Expression;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(field: FiniteField, name: ProcedureName, span: number, width: number,
        constants: LiteralValue[], locals: Dimensions[], traceWidth: number, staticWidth: number)
    {
        this.field = field;
        this.name = name;
        this.span = validateSpan(name, span);
        this.constants = constants;
        this.localVariables = locals.map(d => new LocalVariable(d));
        this.traceRegisters = new TraceSegment('trace', traceWidth);
        this.staticRegisters = new TraceSegment('static', staticWidth);
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
        this.validateExpression(value);
        this._result = value;
    }

    get locals(): ReadonlyArray<Dimensions> {
        return this.localVariables.map(v => v.dimensions);
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    addSubroutine(expression: Expression, localVarIdx: number): void {
        if (this._result)
            throw new Error(`cannot add subroutines to ${this.name} procedure after result has been set`);
        this.validateExpression(expression);
        const variable = this.getLocalVariable(localVarIdx);
        const subroutine = new Subroutine(expression, localVarIdx)
        variable.bind(subroutine, localVarIdx);
        this.subroutines.push(subroutine);
    }

    buildLoadExpression(operation: string, index: number): LoadExpression {
        const source = getLoadSource(operation);
        if (source === 'const') {
            if (index >= this.constants.length)
                throw new Error(`constant with index ${index} has not been defined for ${this.name} procedure`);
            return new LoadExpression(this.constants[index], index);
        }
        else if (source === 'trace') {
            this.validateTraceOffset(index);
            return new LoadExpression(this.traceRegisters, index);
        }
        else if (source === 'static') {
            if (index !== 0) throw new Error(`static registers offset must be 0 for ${this.name} procedure`);
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

    // MUTATION METHODS
    // --------------------------------------------------------------------------------------------
    transformExpressions(transformer: ExpressionTransformer, subIdx: number): void {
        for (let i = subIdx; i < this.subroutines.length; i++) {
            this.subroutines[i].transformExpression(transformer);
        }
    
        let result = transformer(this.result);
        if (this.result !== result) {
            this._result = result;
        }
        else {
            result.transform(transformer);
        }
    }

    replaceSubroutines(subroutines: Subroutine[]): void {
        // TODO: replace subroutines in a different way
        this.subroutines.length = 0;
        subroutines.forEach(s => this.subroutines.push(s));

        this.localVariables.forEach(v => v.clearBinding());
        this.subroutines.forEach(s => this.localVariables[s.localVarIdx].bind(s, s.localVarIdx));
    
        let shiftCount = 0;
        for (let i = 0; i < this.localVariables.length; i++) {
            let variable = this.localVariables[i];
            if (!variable.isBound) {
                this.localVariables.splice(i, 1);
                shiftCount++;
                i--;
            }
            else if (shiftCount > 0) {
                let fromIdx = i + shiftCount;
                this.transformExpressions(e => {
                    if (e instanceof LoadExpression && e.binding instanceof Subroutine && e.index === fromIdx) {
                        return new LoadExpression(e.binding, i);
                    }
                    return e;
                }, 0);
                this.subroutines.forEach(s => s.updateIndex(fromIdx, i));
            }
        }
    }

    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    private getLocalVariable(index: number): LocalVariable {
        if (index >= this.localVariables.length)
            throw new Error(`local variable ${index} has not been defined for ${this.name} procedure`);
        return this.localVariables[index];
    }

    private validateTraceOffset(offset: number): void {
        if (offset < 0)
            throw new Error(`trace offset for ${this.name} procedure cannot be less than 0`);
        if (offset > (this.span - 1))
            throw new Error(`trace offset for ${this.name} procedure cannot be greater than ${(this.span - 1)}`);
    }

    private validateExpression(expression: Expression): void {
        if (expression instanceof LiteralValue) {
            expression.elements.forEach(v => {
                if (!this.field.isElement(v)) {
                    throw new Error(`value ${v} in ${this.name} procedure is not a valid field element`);
                }
            });
        }
        else {
            expression.children.forEach(e => this.validateExpression(e));
        }
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