"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expressions_1 = require("../expressions");
const utils_1 = require("../expressions/utils");
const Subroutine_1 = require("./Subroutine");
const LocalVariable_1 = require("./LocalVariable");
// CLASS DEFINITION
// ================================================================================================
class Procedure {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(name, span, width, constants, locals, traceWidth, staticWidth) {
        this.name = name;
        this.span = validateSpan(name, span);
        this.constants = constants;
        this.localVariables = locals.map(d => new LocalVariable_1.LocalVariable(d));
        this.traceRegisters = new expressions_1.TraceSegment('trace', traceWidth);
        this.staticRegisters = new expressions_1.TraceSegment('static', staticWidth);
        this.resultLength = width;
        this.subroutines = [];
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get result() {
        if (!this._result)
            throw new Error(`${this.name} procedure result hasn't been set yet`);
        return this._result;
    }
    setResult(value) {
        if (this._result)
            throw new Error(`${this.name} procedure result hasn't been set yet`);
        if (!value.isVector || value.dimensions[0] !== this.resultLength)
            throw new Error(`${this.name} procedure must resolve to a vector of ${this.resultLength} elements`);
        this._result = value;
    }
    get locals() {
        return this.localVariables.map(v => v.dimensions);
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    addSubroutine(expression, localVarIdx) {
        if (this._result)
            throw new Error(`cannot add subroutines to ${this.name} procedure after result has been set`);
        const variable = this.getLocalVariable(localVarIdx);
        const subroutine = new Subroutine_1.Subroutine(expression, localVarIdx);
        variable.bind(subroutine, localVarIdx);
        this.subroutines.push(subroutine);
    }
    buildLoadExpression(operation, index) {
        const source = utils_1.getLoadSource(operation);
        if (source === 'const') {
            if (index >= this.constants.length)
                throw new Error(`constant with index ${index} has not been defined for ${this.name} procedure`);
            return new expressions_1.LoadExpression(this.constants[index], index);
        }
        else if (source === 'trace') {
            this.validateTraceOffset(index);
            return new expressions_1.LoadExpression(this.traceRegisters, index);
        }
        else if (source === 'static') {
            if (index !== 0)
                throw new Error(`static registers offset must be 0 for ${this.name} procedure`);
            return new expressions_1.LoadExpression(this.staticRegisters, index);
        }
        else if (source === 'local') {
            const variable = this.getLocalVariable(index);
            const binding = variable.getBinding(index);
            return new expressions_1.LoadExpression(binding, index);
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
        code += `\n    ${this.result.toString()}`;
        return `\n  (${this.name}${code})`;
    }
    // MUTATION METHODS
    // --------------------------------------------------------------------------------------------
    transformExpressions(transformer, subIdx) {
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
    replaceSubroutines(subroutines) {
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
                    if (e instanceof expressions_1.LoadExpression && e.binding instanceof Subroutine_1.Subroutine && e.index === fromIdx) {
                        return new expressions_1.LoadExpression(e.binding, i);
                    }
                    return e;
                }, 0);
                this.subroutines.forEach(s => s.updateIndex(fromIdx, i));
            }
        }
    }
    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    getLocalVariable(index) {
        if (index >= this.localVariables.length)
            throw new Error(`local variable ${index} has not been defined for ${this.name} procedure`);
        return this.localVariables[index];
    }
    validateTraceOffset(offset) {
        if (offset < 0)
            throw new Error(`trace offset for ${this.name} procedure cannot be less than 0`);
        if (offset > (this.span - 1))
            throw new Error(`trace offset for ${this.name} procedure cannot be greater than ${(this.span - 1)}`);
    }
}
exports.Procedure = Procedure;
// HELPER FUNCTIONS
// ================================================================================================
function validateSpan(name, span) {
    if (name === 'transition') {
        if (span !== 1)
            throw new Error(`span ${span} is not valid for ${name} procedure`);
    }
    else if (name === 'evaluation') {
        if (span !== 2)
            throw new Error(`span ${span} is not valid for ${name} procedure`);
    }
    else {
        throw new Error(`invalid procedure name '${name}'`);
    }
    return span;
}
//# sourceMappingURL=Procedure.js.map