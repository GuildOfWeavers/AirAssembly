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
        this.traceRegisters = new expressions_1.TraceSegment(traceWidth, false);
        this.staticRegisters = new expressions_1.TraceSegment(staticWidth, true);
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
    get expressions() {
        const expressions = this.subroutines.map(s => s.expression);
        expressions.push(this.result);
        return expressions;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    addSubroutine(expression, localIndex) {
        // TODO: make sure subroutines can't be added after the result has been set?
        const variable = this.getLocalVariable(localIndex);
        const subroutine = new Subroutine_1.Subroutine(expression, localIndex);
        variable.bind(subroutine, localIndex);
        this.subroutines.push(subroutine);
    }
    buildLoadExpression(operation, index) {
        const source = utils_1.getLoadSource(operation);
        if (source === 'const') {
            if (index >= this.constants.length)
                throw new Error(`constant with index ${index} has not been defined`);
            return new expressions_1.LoadExpression(this.constants[index], index);
        }
        else if (source === 'trace') {
            //TODO: this.validateFrameIndex(index);
            return new expressions_1.LoadExpression(this.traceRegisters, index);
        }
        else if (source === 'static') {
            //TODO: this.validateFrameIndex(index);
            if (!this.staticRegisters)
                throw new Error(`static registers have not been defined`);
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
    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    getLocalVariable(index) {
        if (index >= this.localVariables.length)
            throw new Error(`local variable ${index} has not been defined`);
        return this.localVariables[index];
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