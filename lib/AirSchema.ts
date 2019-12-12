// IMPORTS
// ================================================================================================
import { AirSchema as IAirSchema, ConstraintDescriptor } from "@guildofweavers/air-assembly";
import { FiniteField, createPrimeField } from "@guildofweavers/galois";
import { StaticRegister, StaticRegisterSet, InputRegister, CyclicRegister } from "./registers";
import { Procedure, Constant, ProcedureContext, StoreOperation } from "./procedures";
import { Expression } from "./expressions";
import { ExportDeclaration } from "./exports";
import { analyzeProcedure } from "./analysis";

// CLASS DEFINITION
// ================================================================================================
export class AirSchema implements IAirSchema {

    private _field?                 : FiniteField;

    private _constants              : Constant[];
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

    get constants(): ReadonlyArray<Constant> {
        return this._constants;
    }

    setConstants(values: Constant[]): void {
        if (this.constantCount > 0) throw new Error(`constants have already been set`);
        for (let constant of values) {
            constant.validate(this.field);
            this._constants.push(constant);
        }
    }

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    get staticRegisterCount(): number {
        return this._staticRegisters.length;
    }

    get staticRegisters(): ReadonlyArray<StaticRegister> {
        return this._staticRegisters;
    }

    get secretInputCount(): number {
        let result = 0;
        for (let register of this.staticRegisters) {
            if (register instanceof InputRegister && register.secret) {
                result++;
            }
        }
        return result;
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
        return this.transitionFunction.dimensions[0];
    }

    get transitionFunction(): Procedure {
        if (!this._transitionFunction) throw new Error(`transition function hasn't been set yet`);
        return this._transitionFunction;
    }

    setTransitionFunction(context: ProcedureContext, statements: StoreOperation[], result: Expression): void {
        if (this._transitionFunction) throw new Error(`transition function has already been set`);
        if (!this._field) throw new Error(`transition function cannot be set before field is set`);
        this._transitionFunction = new Procedure(context, statements, result);
    }

    // TRANSITION CONSTRAINTS
    // --------------------------------------------------------------------------------------------
    get constraintCount(): number {
        return this.constraintEvaluator.dimensions[0];
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

    setConstraintEvaluator(context: ProcedureContext, statements: StoreOperation[], result: Expression): void {
        if (this._constraintEvaluator) throw new Error(`constraint evaluator has already been set`);
        if (!this._field) throw new Error(`constraint evaluator cannot be set before field is set`);
        this._constraintEvaluator = new Procedure(context, statements, result);
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
    private validateStaticRegister(register: StaticRegister, index: number): StaticRegister {
        if (!(register instanceof CyclicRegister)) return register;
        register.getValues(this.field).forEach(v => {
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