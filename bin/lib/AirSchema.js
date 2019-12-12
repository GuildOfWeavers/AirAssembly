"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const galois_1 = require("@guildofweavers/galois");
const registers_1 = require("./registers");
const procedures_1 = require("./procedures");
const analysis_1 = require("./analysis");
// CLASS DEFINITION
// ================================================================================================
class AirSchema {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor() {
        this._constants = [];
        this._staticRegisters = [];
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
        this._field = galois_1.createPrimeField(modulus);
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
        if (this.constantCount > 0)
            throw new Error(`constants have already been set`);
        for (let constant of values) {
            constant.validate(this.field);
            this._constants.push(constant);
        }
    }
    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    get staticRegisterCount() {
        return this._staticRegisters.length;
    }
    get staticRegisters() {
        return this._staticRegisters;
    }
    get secretInputCount() {
        let result = 0;
        for (let register of this.staticRegisters) {
            if (register instanceof registers_1.InputRegister && register.secret) {
                result++;
            }
        }
        return result;
    }
    get maxInputCycle() {
        let result = 0;
        for (let register of this.staticRegisters) {
            if (register instanceof registers_1.InputRegister && register.steps && register.steps > result) {
                result = register.steps;
            }
        }
        return result;
    }
    setStaticRegisters(registers) {
        if (this.staticRegisterCount > 0)
            throw new Error(`static registers have already been set`);
        const danglingInputs = registers.getDanglingInputs();
        if (danglingInputs.length > 0)
            throw new Error(`cycle length for input registers ${danglingInputs.join(', ')} is not defined`);
        registers.forEach((r, i) => this._staticRegisters.push(this.validateStaticRegister(r, i)));
    }
    // TRANSITION FUNCTION
    // --------------------------------------------------------------------------------------------
    get traceRegisterCount() {
        return this.transitionFunction.dimensions[0];
    }
    get transitionFunction() {
        if (!this._transitionFunction)
            throw new Error(`transition function hasn't been set yet`);
        return this._transitionFunction;
    }
    setTransitionFunction(context, statements, result) {
        if (this._transitionFunction)
            throw new Error(`transition function has already been set`);
        if (!this._field)
            throw new Error(`transition function cannot be set before field is set`);
        this._transitionFunction = new procedures_1.Procedure(context, statements, result);
    }
    // TRANSITION CONSTRAINTS
    // --------------------------------------------------------------------------------------------
    get constraintCount() {
        return this.constraintEvaluator.dimensions[0];
    }
    get constraintEvaluator() {
        if (!this._constraintEvaluator)
            throw new Error(`constraint evaluator hasn't been set yet`);
        return this._constraintEvaluator;
    }
    get constraints() {
        if (!this._constraints) {
            const constraintAnalysis = analysis_1.analyzeProcedure(this.constraintEvaluator);
            this._constraints = constraintAnalysis.degree.map(d => ({
                degree: d > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Number(d)
            }));
        }
        return this._constraints;
    }
    get maxConstraintDegree() {
        if (this._maxConstraintDegree === undefined) {
            this._maxConstraintDegree = this.constraints.reduce((p, c) => c.degree > p ? c.degree : p, 0);
        }
        return this._maxConstraintDegree;
    }
    setConstraintEvaluator(context, statements, result) {
        if (this._constraintEvaluator)
            throw new Error(`constraint evaluator has already been set`);
        if (!this._field)
            throw new Error(`constraint evaluator cannot be set before field is set`);
        this._constraintEvaluator = new procedures_1.Procedure(context, statements, result);
    }
    // EXPORT DECLARATIONS
    // --------------------------------------------------------------------------------------------
    get exports() {
        if (!this._exportDeclarations)
            throw new Error(`exports have not been set yet`);
        return this._exportDeclarations;
    }
    setExports(declarations) {
        if (this._exportDeclarations)
            throw new Error(`exports have already been set`);
        this._exportDeclarations = new Map();
        const maxInputCycle = this.maxInputCycle;
        for (let declaration of declarations) {
            if (this._exportDeclarations.has(declaration.name))
                throw new Error(`export with name '${declaration.name}' is declared more than once`);
            if (declaration.cycleLength < maxInputCycle)
                throw new Error(`trace cycle for export '${declaration.name}' is smaller than possible input cycle`);
            this._exportDeclarations.set(declaration.name, declaration);
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
    validateStaticRegister(register, index) {
        if (!(register instanceof registers_1.CyclicRegister))
            return register;
        register.getValues(this.field).forEach(v => {
            if (!this.field.isElement(v)) {
                throw new Error(`value ${v} for static register ${index} is not a valid field element`);
            }
        });
        return register;
    }
    validateMainExportSeed(seed) {
        seed.forEach(v => {
            if (!this.field.isElement(v)) {
                throw new Error(`value ${v} in main export initializer is not a valid field element`);
            }
        });
    }
}
exports.AirSchema = AirSchema;
// HELPER FUNCTIONS
// ================================================================================================
function buildFieldExpression(field) {
    if (field.extensionDegree === 1) {
        // this is a prime field
        return `(field prime ${field.characteristic})`;
    }
    else {
        throw new Error('non-prime fields are not supported');
    }
}
//# sourceMappingURL=AirSchema.js.map