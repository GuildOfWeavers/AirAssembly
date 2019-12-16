// IMPORTS
// ================================================================================================
import { FiniteField } from "@guildofweavers/galois";
import { Component as IComponent, ConstraintDescriptor, ProcedureName } from "@guildofweavers/air-assembly";
import { AirSchema } from "./AirSchema";
import { StaticRegister, StaticRegisterSet, InputRegister } from "./registers";
import { AirProcedure, ProcedureContext, StoreOperation, Constant, AirFunction, LocalVariable, Parameter } from "./procedures";
import { Expression } from "./expressions";
import { analyzeProcedure } from "./analysis";
import { isPowerOf2, validate } from "./utils";

// CONSTANTS
// ================================================================================================
const MAX_NAME_LENGTH = 128;
const NAME_REGEXP = /[a-zA-Z]\w*/g;

// CLASS DECLARATION
// ================================================================================================
export class Component implements IComponent {

    readonly name                   : string
    readonly traceRegisterCount     : number;
    readonly constraintCount        : number;
    readonly cycleLength            : number;

    readonly field                  : FiniteField;
    readonly constants              : ReadonlyArray<Constant>;
    readonly functions              : ReadonlyArray<AirFunction>;

    private _staticRegisters        : StaticRegister[];

    private _traceInitializer?      : AirProcedure;
    private _transitionFunction?    : AirProcedure;
    private _constraintEvaluator?   : AirProcedure;

    private _constraints?           : ConstraintDescriptor[];
    private _maxConstraintDegree?   : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(name: string, schema: AirSchema, registers: number, constraints: number, steps: number) {

        validate(name.length <= MAX_NAME_LENGTH, errors.componentNameTooLong(name));
        const matches = name.match(NAME_REGEXP);
        validate(matches !== null && matches.length === 1, errors.componentNameInvalid(name));
        this.name = name;

        validate(Number.isInteger(steps), errors.cycleLengthNotInteger(name));
        validate(steps > 0, errors.cycleLengthTooSmall(name));
        validate(isPowerOf2(steps), errors.cycleLengthNotPowerOf2(name));
        this.cycleLength = steps;

        this.traceRegisterCount = registers;
        this.constraintCount = constraints;

        this.field = schema.field;
        this.constants = schema.constants;
        this.functions = schema.functions;

        this._staticRegisters = [];
    }

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    get staticRegisters(): ReadonlyArray<StaticRegister> {
        return this._staticRegisters;
    }

    get staticRegisterCount(): number {
        return this._staticRegisters.length;
    }

    get secretInputCount(): number {
        let result = 0;
        for (let register of this._staticRegisters) {
            if (register instanceof InputRegister && register.secret) {
                result++;
            }
        }
        return result;
    }

    setStaticRegisters(registers: StaticRegisterSet) {
        validate(this.staticRegisterCount === 0, errors.sRegistersAlreadySet());
        registers.validate();
        registers.forEach((r, i) => this._staticRegisters.push(r));
    }

    // PROCEDURES
    // --------------------------------------------------------------------------------------------
    createProcedureContext(name: ProcedureName): ProcedureContext {
        return new ProcedureContext(name, this);
    }

    // INITIALIZER
    // --------------------------------------------------------------------------------------------
    get traceInitializer(): AirProcedure {
        validate(this._traceInitializer, errors.initializerNotSet());
        return this._traceInitializer;
    }

    setTraceInitializer(context: ProcedureContext, statements: StoreOperation[], result: Expression): void {
        validate(!this._traceInitializer, errors.initializerAlreadySet());
        validate(context.name === 'init', errors.invalidInitializerName(context.name));
        this._traceInitializer = new AirProcedure(context, statements, result);
    }

    // TRANSITION FUNCTION
    // --------------------------------------------------------------------------------------------
    get transitionFunction(): AirProcedure {
        validate(this._transitionFunction, errors.transitionNotSet());
        return this._transitionFunction;
    }

    setTransitionFunction(context: ProcedureContext, statements: StoreOperation[], result: Expression): void {
        validate(!this._transitionFunction, errors.transitionAlreadySet());
        validate(context.name === 'transition', errors.invalidTransitionName(context.name));
        this._transitionFunction = new AirProcedure(context, statements, result);
    }

    // TRANSITION CONSTRAINTS
    // --------------------------------------------------------------------------------------------
    get constraintEvaluator(): AirProcedure {
        validate(this._constraintEvaluator, errors.evaluatorNotSet());
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

    setConstraintEvaluator(context: ProcedureContext, statements: StoreOperation[], result: Expression): void {
        validate(!this._constraintEvaluator, errors.evaluatorAlreadySet());
        validate(context.name === 'evaluation', errors.invalidEvaluatorName(context.name));
        this._constraintEvaluator = new AirProcedure(context, statements, result);
    }

    // CODE GENERATION
    // --------------------------------------------------------------------------------------------
    toString(): string {
        let code = `    (registers ${this.traceRegisterCount}) (constraints ${this.constraintCount}) (steps ${this.cycleLength})`;
        if (this.staticRegisterCount > 0) {
            code += `\n    (static`;
            this.staticRegisters.forEach(r => code += `\n      ${r.toString()}`);
            code += ')';
        }
        code += this.traceInitializer.toString();
        code += this.transitionFunction.toString();
        code += this.constraintEvaluator.toString();
        return `(export ${this.name}\n${code})`;
    }
}

// ERRORS
// ================================================================================================
const errors = {
    componentNameTooLong    : (n: any) => `export name '${n}' is invalid: name length cannot exceed ${MAX_NAME_LENGTH} characters`,
    componentNameInvalid    : (n: any) => `export name '${n}' is invalid`,
    cycleLengthNotInteger   : (n: any) => `trace cycle length for export '${n}' is invalid: cycle length must be an integer`,
    cycleLengthTooSmall     : (n: any) => `trace cycle length for export '${n}' is invalid: cycle length must be greater than 0`,
    cycleLengthNotPowerOf2  : (n: any) => `trace cycle length for export '${n}' is invalid: cycle length must be a power of 2`,
    sRegistersAlreadySet    : () => `static registers have already been set`,
    initializerNotSet       : () => `trace initializer hasn't been set yet`,
    initializerAlreadySet   : () => `trace initializer has already been set`,
    invalidInitializerName  : (n: any) => `trace initializer cannot be set to a ${n} procedure`,
    transitionNotSet        : () => `transition function hasn't been set yet`,
    transitionAlreadySet    : () => `transition function has already been set`,
    invalidTransitionName   : (n: any) => `transition function cannot be set to a ${n} procedure`,
    evaluatorNotSet         : () => `constraint evaluator hasn't been set yet`,
    evaluatorAlreadySet     : () => `constraint evaluator has already been set`,
    invalidEvaluatorName    : (n: any) => `constraint evaluator cannot be set to a ${n} procedure`
};