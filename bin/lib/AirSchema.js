"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const procedures_1 = require("./procedures");
const galois_1 = require("@guildofweavers/galois");
const registers_1 = require("./registers");
// CLASS DEFINITION
// ================================================================================================
class AirSchema {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor() {
        this._constants = [];
        this._staticRegisters = new registers_1.StaticRegisterSet();
    }
    // FIELD
    // --------------------------------------------------------------------------------------------
    get field() {
        if (!this._field)
            throw new Error(`fields has not been set yet`);
        return this._field;
    }
    setField(type, modulus) {
        if (this._field)
            throw new Error('field has already been set');
        if (type !== 'prime')
            throw new Error(`field type '${type}' is not supported`);
        this._field = galois_1.createPrimeField(modulus); // TODO: wasm options
    }
    // CONSTANTS
    // --------------------------------------------------------------------------------------------
    get constantCount() {
        return this._constants.length;
    }
    get constants() {
        return this._constants;
    }
    setConstants(values) {
        if (this._constants.length > 0)
            throw new Error(`constants have already been set`);
        this._constants = values.slice();
    }
    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    get staticRegisterCount() {
        return this._staticRegisters.size;
    }
    get staticRegisters() {
        return this._staticRegisters;
    }
    setStaticRegisters(registers) {
        if (this._staticRegisters.size > 0)
            throw new Error(`static registers have already been set`);
        this._staticRegisters = registers;
        // TODO: validate registers
    }
    // TRANSITION FUNCTION
    // --------------------------------------------------------------------------------------------
    get traceRegisterCount() {
        return this.transitionFunction.resultLength;
    }
    get transitionFunction() {
        if (!this._transitionFunction)
            throw new Error(`transition function hasn't been set yet`);
        return this._transitionFunction;
    }
    setTransitionFunction(span, width, locals) {
        if (this._transitionFunction)
            throw new Error(`transition function has already been set`);
        const constants = this._constants;
        const traceWidth = width;
        const staticWidth = this.staticRegisterCount;
        this._transitionFunction = new procedures_1.Procedure('transition', span, width, constants, locals, traceWidth, staticWidth);
        return this._transitionFunction;
    }
    // TRANSITION CONSTRAINTS
    // --------------------------------------------------------------------------------------------
    get constraintCount() {
        return this.constraintEvaluator.resultLength;
    }
    get constraintEvaluator() {
        if (!this._constraintEvaluator)
            throw new Error(`constraint evaluator hasn't been set yet`);
        return this._constraintEvaluator;
    }
    setConstraintEvaluator(span, width, locals) {
        if (this._constraintEvaluator)
            throw new Error(`constraint evaluator has already been set`);
        const constants = this._constants;
        const traceWidth = this.traceRegisterCount;
        const staticWidth = this.staticRegisterCount;
        this._constraintEvaluator = new procedures_1.Procedure('evaluation', span, width, constants, locals, traceWidth, staticWidth);
        return this._constraintEvaluator;
    }
    // CODE OUTPUT
    // --------------------------------------------------------------------------------------------
    toString() {
        let code = `\n  (field prime ${this.field.modulus})`;
        if (this.constantCount > 0)
            code += `\n  (const\n    ${this.constants.map(c => c.toString()).join('\n    ')})`;
        code += this.staticRegisters.toString();
        code += this.transitionFunction.toString();
        code += this.constraintEvaluator.toString();
        return `(module${code}\n)`;
    }
}
exports.AirSchema = AirSchema;
// HELPER FUNCTIONS
// ================================================================================================
/*
function compressProcedure(locals: LocalVariable[], body: ProcedureBody): void {

    // collect references to locals from all expressions
    let expressions = [...body.statements, body.result];
    const bindings = new Map<Expression, Expression[]>();
    expressions.forEach(e => e.collectLoadOperations('local', bindings));

    // if a store expression is referenced only once, substitute it by value
    const retainedStatements: StoreExpression[] = [];
    for (let i = 0; i < body.statements.length; i++) {
        let statement = body.statements[i];
        let dependents = bindings.get(statement);
        if (!dependents) continue;
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
*/ 
//# sourceMappingURL=AirSchema.js.map