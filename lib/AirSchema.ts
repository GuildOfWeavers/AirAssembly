// IMPORTS
// ================================================================================================
import { StarkLimits, Dimensions } from "@guildofweavers/air-assembly";
import { LiteralValue } from "./expressions";
import { FieldDeclaration, CyclicRegister, InputRegister } from "./declarations";
import { Procedure } from "./procedures";

// CLASS DEFINITION
// ================================================================================================
export class AirSchema {

    private fieldDeclaration!       : FieldDeclaration;

    private _constants              : LiteralValue[];
    readonly staticRegisters        : any[];

    private _transitionFunction?    : Procedure;
    private _constraintEvaluator?   : Procedure;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor() {
        this._constants = [];
        this.staticRegisters = [];
    }

    // FIELD
    // --------------------------------------------------------------------------------------------
    setField(field: FieldDeclaration): void {
        if (this.fieldDeclaration) throw new Error('the field has already been set');
        this.fieldDeclaration = field;
    }

    // CONSTANTS
    // --------------------------------------------------------------------------------------------
    get constants(): LiteralValue[] {
        return this._constants;
    }

    setConstants(values: LiteralValue[]): void {
        if (this._constants.length > 0) throw new Error(`constants have already been set`);
        this._constants = values;
    }

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    get staticRegisterCount(): number {
        return this.staticRegisters.length;
    }

    addInputRegister(scope: string, binary: boolean, typeOrParent: string | number, steps?: number): void {
        let rank = 0, parent: InputRegister | undefined;
        if (typeof typeOrParent === 'number') {
            parent = this.staticRegisters[typeOrParent];
            if (!parent) throw new Error(`TODO`);
            // TODO: parent must be an input register
            // TODO: parent must not be a leaf
            rank = parent.rank + 1;
        }
        else if (typeOrParent === 'vector') {
            rank = 1;
        }
        const index = this.staticRegisters.length;
        const register = new InputRegister(index, scope, rank, binary, parent, steps);
        this.staticRegisters.push(register);
    }

    addCyclicRegister(values: bigint[]): void {
        const index = this.staticRegisters.length;
        const register = new CyclicRegister(index, values);
        this.staticRegisters.push(register);
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
        const traceWidth = width;
        const staticWidth = this.staticRegisterCount;
        this._transitionFunction = new Procedure('transition', span, width, this.constants, locals, traceWidth, staticWidth);
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

    setConstraintEvaluator(span: number, width: number, locals: Dimensions[]): Procedure {
        if (this._constraintEvaluator) throw new Error(`constraint evaluator has already been set`);
        const traceWidth = this.traceRegisterCount;
        const staticWidth = this.staticRegisterCount;
        this._constraintEvaluator = new Procedure('evaluation', span, width, this.constants, locals, traceWidth, staticWidth);
        return this._constraintEvaluator;
    }

    // CODE OUTPUT
    // --------------------------------------------------------------------------------------------
    toString() {
        // field, constants, static and input registers
        let code = `\n  ${this.fieldDeclaration.toString()}`;
        if (this.constants.length > 0)
            code += `\n  (const\n    ${this.constants.map(c => c.toString()).join('\n    ')})`;
        if (this.staticRegisters.length > 0)
            code += `\n  (static\n    ${this.staticRegisters.map(r => r.toString()).join('\n    ')})`;
        
        // transition function
        code += this.transitionFunction.toString();
        code += this.constraintEvaluator.toString();

        return `(module${code}\n)`;
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