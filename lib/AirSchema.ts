// IMPORTS
// ================================================================================================
import { AirSchema as IAirSchema, StarkLimits, Dimensions, FieldDescriptor, ConstraintDescriptor } from "@guildofweavers/air-assembly";
import { LiteralValue } from "./expressions";
import { Procedure } from "./procedures";
import { analyzeProcedure } from "./analysis";
import { StaticRegisterSet } from "./registers";

// CLASS DEFINITION
// ================================================================================================
export class AirSchema implements IAirSchema {

    private _field?                 : FieldDescriptor;

    private _constants              : LiteralValue[];
    private _staticRegisters        : StaticRegisterSet;

    private _transitionFunction?    : Procedure;
    private _constraintEvaluator?   : Procedure;

    private _constraints?           : ConstraintDescriptor[];
    private _maxConstraintDegree?   : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor() {
        this._constants = [];
        this._staticRegisters = new StaticRegisterSet();
    }

    // FIELD
    // --------------------------------------------------------------------------------------------
    get field(): FieldDescriptor {
        if (!this._field) throw new Error(`fields has not been set yet`);
        return this._field;
    }

    setField(type: 'prime', modulus: bigint): void {
        if (this._field) throw new Error('field has already been set');
        if (type !== 'prime') throw new Error(`field type '${type}' is not supported`);
        this._field = { type, modulus };
    }

    // CONSTANTS
    // --------------------------------------------------------------------------------------------
    get constantCount(): number {
        return this._constants.length;
    }

    get constants(): ReadonlyArray<LiteralValue> {
        return this._constants;
    }

    setConstants(values: LiteralValue[]): void {
        if (this._constants.length > 0) throw new Error(`constants have already been set`);
        this._constants = values.slice();
    }

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    get staticRegisterCount(): number {
        return this._staticRegisters.size;
    }

    get staticRegisters(): StaticRegisterSet {
        return this._staticRegisters;
    }

    setStaticRegisters(registers: StaticRegisterSet): void {
        if (this._staticRegisters.size > 0) throw new Error(`static registers have already been set`);
        this._staticRegisters = registers;
        // TODO: validate registers
    }

    // TRANSITION FUNCTION
    // --------------------------------------------------------------------------------------------
    get traceRegisterCount(): number {
        return this.transitionFunction.resultLength;
    }

    get transitionFunction(): Procedure {
        if (!this._transitionFunction) throw new Error(`transition function hasn't been set yet`);
        return this._transitionFunction;
    }

    setTransitionFunction(span: number, width: number, locals: Dimensions[]): Procedure {
        if (this._transitionFunction) throw new Error(`transition function has already been set`);
        const constants = this._constants;
        const traceWidth = width;
        const staticWidth = this.staticRegisterCount;
        this._transitionFunction = new Procedure('transition', span, width, constants, locals, traceWidth, staticWidth);
        return this._transitionFunction;
    }

    // TRANSITION CONSTRAINTS
    // --------------------------------------------------------------------------------------------
    get constraintCount(): number {
        return this.constraintEvaluator.resultLength;
    }

    get constraintEvaluator(): Procedure {
        if (!this._constraintEvaluator) throw new Error(`constraint evaluator hasn't been set yet`);
        return this._constraintEvaluator;
    }

    get constraints(): ConstraintDescriptor[] {
        if (!this._constraints)  {
            const constraintAnalysis = analyzeProcedure(this.constraintEvaluator);
            this._constraints = constraintAnalysis.degree.map(d => ({
                degree  : d > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Number(d)
            }));
        }
        return this._constraints;
    }

    get maxConstraintDegree(): number {
        if (this._maxConstraintDegree === undefined) {
            this._maxConstraintDegree = this.constraints.reduce((p, c) => c.degree > p ? c.degree : p, 0);
        }
        return this._maxConstraintDegree;
    }

    setConstraintEvaluator(span: number, width: number, locals: Dimensions[]): Procedure {
        if (this._constraintEvaluator) throw new Error(`constraint evaluator has already been set`);
        const constants = this._constants;
        const traceWidth = this.traceRegisterCount;
        const staticWidth = this.staticRegisterCount;
        this._constraintEvaluator = new Procedure('evaluation', span, width, constants, locals, traceWidth, staticWidth);
        return this._constraintEvaluator;
    }

    // CODE OUTPUT
    // --------------------------------------------------------------------------------------------
    toString() {
        let code = `\n  (field ${this.field.type} ${this.field.modulus})`;
        if (this.constantCount > 0)
            code += `\n  (const\n    ${this.constants.map(c => c.toString()).join('\n    ')})`;
        code += this.staticRegisters.toString();
        code += this.transitionFunction.toString();
        code += this.constraintEvaluator.toString();

        return `(module${code}\n)`;
    }

    // VALIDATION
    // --------------------------------------------------------------------------------------------
    validateLimits(limits: StarkLimits): void {
        if (this.traceRegisterCount > limits.maxTraceRegisters)
            throw new Error(`number of state registers cannot exceed ${limits.maxTraceRegisters}`);
        else if (this.staticRegisterCount > limits.maxStaticRegisters)
            throw new Error(`number of static registers cannot exceed ${limits.maxStaticRegisters}`);
        else if (this.constraintCount > limits.maxConstraintCount)
            throw new Error(`number of transition constraints cannot exceed ${limits.maxConstraintCount}`);
        // TODO: check constraint degree
    }
}

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