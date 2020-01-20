// IMPORTS
// ================================================================================================
import { FiniteField } from "@guildofweavers/galois";
import { AirComponent as IComponent, ConstraintDescriptor, ProcedureName, InputRegisterMaster } from "@guildofweavers/air-assembly";
import { AirSchema } from "./AirSchema";
import { StaticRegister, InputRegister, MaskRegister, CyclicRegister, PrngSequence } from "./registers";
import { AirProcedure, ProcedureContext, StoreOperation, Constant, AirFunction } from "./procedures";
import { Expression } from "./expressions";
import { analyzeProcedure } from "./analysis";
import { isPowerOf2, validate } from "./utils";

// CONSTANTS
// ================================================================================================
const MAX_NAME_LENGTH = 128;
const NAME_REGEXP = /[a-zA-Z]\w*/g;

// CLASS DECLARATION
// ================================================================================================
export class AirComponent implements IComponent {

    readonly name                   : string
    readonly traceRegisterCount     : number;
    readonly constraintCount        : number;
    readonly cycleLength            : number;

    readonly field                  : FiniteField;
    readonly constants              : ReadonlyArray<Constant>;
    readonly functions              : ReadonlyArray<AirFunction>;

    private _inputRegisters         : InputRegister[];
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

        this._inputRegisters = [];
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

    addInputRegister(scope: string, binary: boolean, master?: InputRegisterMaster, steps?: number, offset?: number): void {
        const registerIdx = this.staticRegisterCount;
        validate(registerIdx === this._inputRegisters.length, errors.inputRegOutOfOrder());

        let rank = 0;
        if (master) {
            const relation = master.relation;
            const masterReg = this._inputRegisters[master.index];
            validate(relation === 'peerof' || relation === 'childof', errors.invalidInputMasterRel(registerIdx, relation));;
            validate(masterReg, errors.invalidInputMasterIndex(registerIdx, master.index));
            validate(masterReg instanceof InputRegister, errors.inputMasterNotInputReg(registerIdx, master.index));
            validate(!masterReg.isLeaf, errors.inputMasterIsLeafReg(registerIdx, master.index));
            rank = (relation === 'peerof' ? masterReg.rank : masterReg.rank + 1);
        }
        else {
            rank = 1;
        }

        if (steps !== undefined) {
            validate(steps <= this.cycleLength, errors.inputCycleTooBig(steps, this.cycleLength));
        }
    
        const register = new InputRegister(scope, rank, binary, master, steps, offset);
        this._inputRegisters.push(register);
        this._staticRegisters.push(register);
    }

    addMaskRegister(sourceIdx: number, inverted: boolean): void {
        const source = this._inputRegisters[sourceIdx];
        const registerIdx = this.staticRegisterCount;
        validate(source, errors.invalidMaskSourceIndex(registerIdx, sourceIdx));
        validate(source instanceof InputRegister, errors.maskSourceNotInputReg(registerIdx, sourceIdx));
        const lastRegister = this._staticRegisters[registerIdx - 1];
        validate(!(lastRegister instanceof CyclicRegister), errors.maskRegOutOfOrder());
        const register = new MaskRegister(sourceIdx, inverted);
        this._staticRegisters.push(register);
    }

    addCyclicRegister(values: bigint[] | PrngSequence): void {
        validate(values.length <= this.cycleLength, errors.cyclicValuesTooMany(this.cycleLength));
        const register = new CyclicRegister(values, this.field);
        this._staticRegisters.push(register);
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
            this._constraints = constraintAnalysis.results.map(r => ({
                degree      : r.degree > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Number(r.degree),
                traceRefs   : r.traceRefs,
                staticRefs  : r.staticRefs
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

    // VALIDATION
    // --------------------------------------------------------------------------------------------
    validate(): void {
        const danglingInputs = this.getDanglingInputRegisters();
        validate(danglingInputs.length === 0, errors.danglingInputRegisters(danglingInputs));
        validate(this._traceInitializer, errors.transitionNotSet());
        validate(this._transitionFunction, errors.transitionNotSet());
        validate(this._constraintEvaluator, errors.evaluatorNotSet());
    }

    private getDanglingInputRegisters(): number[] {
        const registers = new Set<InputRegister>(this._inputRegisters);
        const leaves = this._inputRegisters.filter(r => r.isLeaf);

        for (let leaf of leaves) {
            let register : InputRegister | undefined = leaf;
            while (register) {
                registers.delete(register);
                register = register.master !== undefined
                    ? this._inputRegisters[register.master.index]
                    : undefined;
            }
        }

        const result: number[] = [];
        registers.forEach(r => result.push(this._inputRegisters.indexOf(r)));
        return result;
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
    inputRegOutOfOrder      : () => `input register cannot be preceded by other register types`,
    inputCycleTooBig        : (c: any, t: any) => `input cycle length (${c}) cannot be greater than trace cycle length (${t})`,
    invalidInputMasterIndex : (r: any, s: any) => `invalid master for input register ${r}: register ${s} is undefined`,
    invalidInputMasterRel   : (r: any, p: any) => `invalid master for input register ${r}: '${p}' is not a valid relation`,
    inputMasterNotInputReg  : (r: any, s: any) => `invalid master for input register ${r}: register ${s} is not an input register`,
    inputMasterIsLeafReg    : (r: any, s: any) => `invalid master for input register ${r}: register ${s} is a leaf register`,
    danglingInputRegisters  : (d: any[]) => `cycle length for input registers ${d.join(', ')} is not defined`,
    maskRegOutOfOrder       : () => `mask registers cannot be preceded by cyclic registers`,
    invalidMaskSourceIndex  : (r: any, s: any) => `invalid source for mask register ${r}: register ${s} is undefined`,
    maskSourceNotInputReg   : (r: any, s: any) => `invalid source for mask register ${r}: register ${s} is not an input register`,
    cyclicValuesTooMany     : (t: any) => `number of values in cyclic register must be smaller than trace cycle length (${t})`,
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