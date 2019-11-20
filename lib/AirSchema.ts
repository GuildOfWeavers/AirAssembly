// IMPORTS
// ================================================================================================
import { AirSchema as IAirSchema, StarkLimits, ConstraintDescriptor } from "@guildofweavers/air-assembly";
import { FiniteField, createPrimeField } from "@guildofweavers/galois";
import { LiteralValue, Dimensions } from "./expressions";
import { Procedure } from "./procedures";
import { analyzeProcedure } from "./analysis";
import { StaticRegister, StaticRegisterSet, InputRegister, CyclicRegister } from "./registers";
import { ExportDeclaration } from "./exports";

// CLASS DEFINITION
// ================================================================================================
export class AirSchema implements IAirSchema {

    private _field?                 : FiniteField;

    private _constants              : LiteralValue[];
    private _staticRegisters        : StaticRegister[];

    private _transitionFunction?    : Procedure;
    private _constraintEvaluator?   : Procedure;

    private _constraints?           : ConstraintDescriptor[];
    private _maxConstraintDegree?   : number;

    private _exportDeclarations?    : Map<string, ExportDeclaration>;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor() {
        this._constants = [];
        this._staticRegisters = [];
    }

    // FIELD
    // --------------------------------------------------------------------------------------------
    get field(): FiniteField {
        if (!this._field) throw new Error(`fields has not been set yet`);
        return this._field;
    }

    setField(type: 'prime', modulus: bigint): void {
        if (this._field) throw new Error('field has already been set');
        if (type !== 'prime') throw new Error(`field type '${type}' is not supported`);
        this._field = createPrimeField(modulus);
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
        if (this.constantCount > 0) throw new Error(`constants have already been set`);
        values.forEach((v, i) => this._constants.push(this.validateConstant(v, i)));
    }

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    get staticRegisterCount(): number {
        return this._staticRegisters.length;
    }

    get staticRegisters(): ReadonlyArray<StaticRegister> {
        return this._staticRegisters;
    }

    get maxInputCycle(): number {
        let result = 0;
        for (let register of this.staticRegisters) {
            if (register instanceof InputRegister && register.steps && register.steps > result) {
                result = register.steps;
            }
        }
        return result;
    }

    setStaticRegisters(registers: StaticRegisterSet): void {
        if (this.staticRegisterCount > 0) throw new Error(`static registers have already been set`);
        const danglingInputs = registers.getDanglingInputs();
        if (danglingInputs.length > 0)
            throw new Error(`cycle length for input registers ${danglingInputs.join(', ')} is not defined`);
        registers.forEach((r, i) => this._staticRegisters.push(this.validateStaticRegister(r, i)));
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
        if (!this._field) throw new Error(`transition function cannot be set before field is set`);
        const constants = this._constants;
        const traceWidth = width;
        const staticWidth = this.staticRegisterCount;
        this._transitionFunction = new Procedure(this.field, 'transition', span, width, constants, locals, traceWidth, staticWidth);
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
        if (!this._field) throw new Error(`constraint evaluator cannot be set before field is set`);
        const constants = this._constants;
        const traceWidth = this.traceRegisterCount;
        const staticWidth = this.staticRegisterCount;
        this._constraintEvaluator = new Procedure(this.field, 'evaluation', span, width, constants, locals, traceWidth, staticWidth);
        return this._constraintEvaluator;
    }

    // EXPORT DECLARATIONS
    // --------------------------------------------------------------------------------------------
    get exports(): Map<string, ExportDeclaration> {
        if (!this._exportDeclarations) throw new Error(`exports have not been set yet`);
        return this._exportDeclarations;
    }

    setExports(declarations: ExportDeclaration[]): void {
        if (this._exportDeclarations) throw new Error(`exports have already been set`);
        this._exportDeclarations = new Map();

        const maxInputCycle = this.maxInputCycle;
        for (let declaration of declarations) {
            if (this._exportDeclarations.has(declaration.name))
                throw new Error(`export with name '${declaration.name}' is declared more than once`);
            if (declaration.cycleLength < maxInputCycle)
                throw new Error(`trace cycle for export '${declaration.name}' is smaller than possible input cycle`);
            this._exportDeclarations.set(declaration.name, declaration)
        }

        const mainExport = this.exports.get('main');
        if (mainExport && mainExport.seed) {
            if (mainExport.seed.length !== this.traceRegisterCount) 
                throw new Error(`initializer for main export must resolve to a vector of ${this.traceRegisterCount} elements`);
            this.validateMainExportSeed(mainExport.seed);
        }
    }

    // CODE OUTPUT
    // --------------------------------------------------------------------------------------------
    toString() {
        let code = `\n  ${buildFieldExpression(this.field)}`;
        if (this.constantCount > 0)
            code += `\n  (const\n    ${this.constants.map(c => c.toString()).join('\n    ')})`;
        if (this.staticRegisterCount > 0)
            code += `\n  (static\n    ${this.staticRegisters.map(r => r.toString()).join('\n    ')})`;
        code += this.transitionFunction.toString();
        code += this.constraintEvaluator.toString();
        this.exports.forEach(d => code += `\n  ${d.toString()}`);

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
        else if (this.maxConstraintDegree > limits.maxConstraintDegree)
            throw new Error(`max constraint degree cannot exceed ${limits.maxConstraintDegree}`);
    }

    private validateConstant(constant: LiteralValue, index: number): LiteralValue {
        constant.elements.forEach(v => {
            if (!this.field.isElement(v)) {
                throw new Error(`value ${v} for constant ${index} is not a valid field element`);
            }
        });
        return constant;
    }

    private validateStaticRegister(register: StaticRegister, index: number): StaticRegister {
        if (!(register instanceof CyclicRegister)) return register;
        register.values.forEach(v => {
            if (!this.field.isElement(v)) {
                throw new Error(`value ${v} for static register ${index} is not a valid field element`);
            }
        });
        return register;
    }

    private validateMainExportSeed(seed: bigint[]): void {
        seed.forEach(v => {
            if (!this.field.isElement(v)) {
                throw new Error(`value ${v} in main export initializer is not a valid field element`);
            }
        });
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function buildFieldExpression(field: FiniteField): string {
    if (field.extensionDegree === 1) {
        // this is a prime field
        return `(field prime ${field.characteristic})`;
    }
    else {
        throw new Error('non-prime fields are not supported');
    }
}