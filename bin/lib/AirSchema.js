"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expressions_1 = require("./expressions");
const declarations_1 = require("./declarations");
const utils_1 = require("./expressions/utils");
// CLASS DEFINITION
// ================================================================================================
class AirSchema {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor() {
        this.constants = [];
        this.staticRegisters = [];
        this.tFunctionLocals = [];
        this.tConstraintsLocals = [];
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get inTransitionFunction() {
        return (this.tFunctionBody === undefined);
    }
    // FIELD
    // --------------------------------------------------------------------------------------------
    setField(field) {
        if (this.fieldDeclaration)
            throw new Error('the field has already been set');
        this.fieldDeclaration = field;
    }
    // CONSTANTS
    // --------------------------------------------------------------------------------------------
    addConstant(value) {
        this.constants.push(value);
    }
    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    get staticRegisterCount() {
        return this.staticRegisters.length;
    }
    addInputRegister(scope, binary, typeOrParent, filling, steps) {
        let rank = 0, parent;
        if (typeof typeOrParent === 'number') {
            parent = this.staticRegisters[typeOrParent];
            if (!parent)
                throw new Error(`TODO`);
            // TODO: parent must be an input register
            // TODO: parent must not be a leaf
            rank = parent.rank + 1;
        }
        else if (typeOrParent === 'vector') {
            rank = 1;
        }
        const index = this.staticRegisters.length;
        const register = new declarations_1.InputRegister(index, scope, rank, binary, filling, parent, steps);
        this.staticRegisters.push(register);
    }
    addCyclicRegister(values) {
        const register = new declarations_1.CyclicRegister(values);
        this.staticRegisters.push(register);
    }
    // TRANSITION FUNCTION
    // --------------------------------------------------------------------------------------------
    get traceRegisterCount() {
        if (!this.tFunctionSig)
            throw new Error('trace register count has not been set yet');
        return this.tFunctionSig.width;
    }
    get transitionFunction() {
        return {
            locals: this.tFunctionLocals.map(v => v.dimensions),
            assignments: this.tFunctionBody.statements,
            result: this.tFunctionBody.result
        };
    }
    setTransitionFunctionMeta(span, width, locals) {
        if (this.tFunctionSig)
            throw new Error(`transition function signature has already been set`);
        if (span === 0)
            throw new Error('transition function span cannot be 0');
        if (width === 0)
            throw new Error('trace register count cannot be 0');
        this.tFunctionSig = { span, width };
        locals.forEach(v => this.tFunctionLocals.push(v));
        this.staticRegisterBank = new expressions_1.TraceSegment(this.staticRegisters.length, true); // TODO: move somewhere else?
        this.traceRegisterBank = new expressions_1.TraceSegment(width, false);
    }
    setTransitionFunctionBody(result, statements) {
        // TODO: validate unique call
        this.tFunctionBody = { result, statements };
        // TODO: validate?
    }
    get transitionFunctionExpressions() {
        return [...this.tFunctionBody.statements, this.tFunctionBody.result];
    }
    // TRANSITION CONSTRAINTS
    // --------------------------------------------------------------------------------------------
    get constraintCount() {
        if (!this.tConstraintsSig)
            throw new Error('constraint count has not been set yet');
        return this.tConstraintsSig.width;
    }
    get constraintEvaluator() {
        return {
            locals: this.tConstraintsLocals.map(v => v.dimensions),
            assignments: this.tConstraintsBody.statements,
            result: this.tConstraintsBody.result
        };
    }
    setTransitionConstraintsMeta(span, width, locals) {
        if (this.tConstraintsSig)
            throw new Error(`transition constraints signature has already been set`);
        if (span === 0)
            throw new Error('transition constraint span cannot be set to 0');
        if (width === 0)
            throw new Error('constraint count cannot be 0');
        this.tConstraintsSig = { span, width };
        locals.forEach(v => this.tConstraintsLocals.push(v));
    }
    setTransitionConstraintsBody(result, statements) {
        // TODO: validate unique call
        this.tConstraintsBody = { result, statements };
        // TODO: validate?
    }
    get transitionConstraintsExpressions() {
        return [...this.tConstraintsBody.statements, this.tConstraintsBody.result];
    }
    // ACCESSOR OPERATIONS
    // --------------------------------------------------------------------------------------------
    buildLoadExpression(operation, index) {
        const source = utils_1.getLoadSource(operation);
        if (source === 'const') {
            if (index >= this.constants.length)
                throw new Error(`constant with index ${index} has not been defined`);
            return new expressions_1.LoadExpression(this.constants[index], index);
        }
        else if (source === 'trace') {
            //TODO: this.validateFrameIndex(index);
            return new expressions_1.LoadExpression(this.traceRegisterBank, index);
        }
        else if (source === 'static') {
            //TODO: this.validateFrameIndex(index);
            if (!this.staticRegisterBank)
                throw new Error(`static registers have not been defined`);
            return new expressions_1.LoadExpression(this.staticRegisterBank, index);
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
    buildStoreExpression(operation, index, value) {
        const target = utils_1.getStoreTarget(operation);
        if (target === 'local') {
            const variable = this.getLocalVariable(index);
            const result = new expressions_1.StoreExpression(operation, index, value);
            variable.bind(result, index);
            return result;
        }
        else {
            throw new Error(`${operation} is not a valid store operation`);
        }
    }
    // CODE OUTPUT
    // --------------------------------------------------------------------------------------------
    toString() {
        // field, constants, static and input registers
        let code = `\n  ${this.fieldDeclaration.toString()}`;
        if (this.constants.length > 0)
            code += '\n  ' + this.constants.map(c => `(const ${c.toString()})`).join(' ');
        if (this.staticRegisters.length > 0)
            code += `\n  ${this.staticRegisters.map(r => r.toString()).join(' ')}`;
        // transition function
        let tFunction = `\n    (span ${this.tFunctionSig.span}) (result vector ${this.traceRegisterCount})`; // TODO
        if (this.tFunctionLocals.length > 0)
            tFunction += `\n    ${this.tFunctionLocals.map(v => v.toString()).join(' ')}`;
        tFunction += this.transitionFunctionExpressions.map(s => `\n    ${s.toString()}`).join('');
        code += `\n  (transition${tFunction})`;
        // transition constraints
        let tConstraints = `\n    (span ${this.tConstraintsSig.span}) (result vector ${this.constraintCount})`; // TODO
        if (this.tConstraintsLocals.length > 0)
            tConstraints += `\n    ${this.tConstraintsLocals.map(v => v.toString()).join(' ')}`;
        tConstraints += this.transitionConstraintsExpressions.map(s => `\n    ${s.toString()}`).join('');
        code += `\n  (evaluation${tConstraints})`;
        return `(module${code}\n)`;
    }
    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    getLocalVariable(index) {
        const locals = (this.inTransitionFunction)
            ? this.tFunctionLocals
            : this.tConstraintsLocals;
        if (index >= locals.length)
            throw new Error(`local variable ${index} has not defined`);
        return locals[index];
    }
}
exports.AirSchema = AirSchema;
// HELPER FUNCTIONS
// ================================================================================================
function compressProcedure(locals, body) {
    // collect references to locals from all expressions
    let expressions = [...body.statements, body.result];
    const bindings = new Map();
    expressions.forEach(e => e.collectLoadOperations('local', bindings));
    // if a store expression is referenced only once, substitute it by value
    const retainedStatements = [];
    for (let i = 0; i < body.statements.length; i++) {
        let statement = body.statements[i];
        let dependents = bindings.get(statement);
        if (!dependents)
            continue;
        if (dependents.length === 1) {
            let dependent = dependents[0];
            expressions.slice(i).forEach(e => e.replace(dependent, statement.value));
        }
        else if (dependents.length > 1) {
            retainedStatements.push(statement);
        }
    }
    // update body object and compress all remaining expressions
    body.statements = retainedStatements;
    expressions = [...body.statements, body.result];
    expressions.forEach(e => e.compress());
    // remove all unreferenced local variables
    locals.forEach(v => v.clearBinding());
    body.statements.forEach(s => locals[s.index].bind(s, s.index));
    let shiftCount = 0;
    for (let i = 0; i < locals.length; i++) {
        let variable = locals[i];
        if (!variable.isBound) {
            locals.splice(i, 1);
            shiftCount++;
            i--;
        }
        else if (shiftCount > 0) {
            expressions.forEach(e => e.updateAccessorIndex('local', i + shiftCount, i));
        }
    }
}
//# sourceMappingURL=AirSchema.js.map