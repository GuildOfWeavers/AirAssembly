"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registers_1 = require("./registers");
const procedures_1 = require("./procedures");
const analysis_1 = require("./analysis");
const utils_1 = require("./utils");
// CONSTANTS
// ================================================================================================
const MAX_NAME_LENGTH = 128;
const NAME_REGEXP = /[a-zA-Z]\w*/g;
// CLASS DECLARATION
// ================================================================================================
class AirComponent {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(name, schema, registers, constraints, steps) {
        utils_1.validate(name.length <= MAX_NAME_LENGTH, errors.componentNameTooLong(name));
        const matches = name.match(NAME_REGEXP);
        utils_1.validate(matches !== null && matches.length === 1, errors.componentNameInvalid(name));
        this.name = name;
        utils_1.validate(Number.isInteger(steps), errors.cycleLengthNotInteger(name));
        utils_1.validate(steps > 0, errors.cycleLengthTooSmall(name));
        utils_1.validate(utils_1.isPowerOf2(steps), errors.cycleLengthNotPowerOf2(name));
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
    get staticRegisters() {
        return this._staticRegisters;
    }
    get staticRegisterCount() {
        return this._staticRegisters.length;
    }
    get secretInputCount() {
        let result = 0;
        for (let register of this._staticRegisters) {
            if (register instanceof registers_1.InputRegister && register.secret) {
                result++;
            }
        }
        return result;
    }
    addInputRegister(scope, binary, parentIdx, steps, offset) {
        const registerIdx = this.staticRegisterCount;
        utils_1.validate(registerIdx === this._inputRegisters.length, errors.inputRegOutOfOrder());
        let rank = 0;
        if (typeof parentIdx === 'number') {
            const parent = this._inputRegisters[parentIdx];
            utils_1.validate(parent, errors.invalidInputParentIndex(registerIdx, parentIdx));
            utils_1.validate(parent instanceof registers_1.InputRegister, errors.inputParentNotInputReg(registerIdx, parentIdx));
            utils_1.validate(!parent.isLeaf, errors.inputParentIsLeafReg(registerIdx, parentIdx));
            rank = parent.rank + 1;
        }
        else {
            rank = 1;
        }
        if (steps !== undefined) {
            utils_1.validate(steps <= this.cycleLength, errors.inputCycleTooBig(steps, this.cycleLength));
        }
        const register = new registers_1.InputRegister(scope, rank, binary, parentIdx, steps, offset);
        this._inputRegisters.push(register);
        this._staticRegisters.push(register);
    }
    addMaskRegister(sourceIdx, inverted) {
        const source = this._inputRegisters[sourceIdx];
        const registerIdx = this.staticRegisterCount;
        utils_1.validate(source, errors.invalidMaskSourceIndex(registerIdx, sourceIdx));
        utils_1.validate(source instanceof registers_1.InputRegister, errors.maskSourceNotInputReg(registerIdx, sourceIdx));
        const lastRegister = this._staticRegisters[registerIdx - 1];
        utils_1.validate(!(lastRegister instanceof registers_1.CyclicRegister), errors.maskRegOutOfOrder());
        const register = new registers_1.MaskRegister(sourceIdx, inverted);
        this._staticRegisters.push(register);
    }
    addCyclicRegister(values) {
        utils_1.validate(values.length <= this.cycleLength, errors.cyclicValuesTooMany(this.cycleLength));
        const register = new registers_1.CyclicRegister(values, this.field);
        this._staticRegisters.push(register);
    }
    // PROCEDURES
    // --------------------------------------------------------------------------------------------
    createProcedureContext(name) {
        return new procedures_1.ProcedureContext(name, this);
    }
    // INITIALIZER
    // --------------------------------------------------------------------------------------------
    get traceInitializer() {
        utils_1.validate(this._traceInitializer, errors.initializerNotSet());
        return this._traceInitializer;
    }
    setTraceInitializer(context, statements, result) {
        utils_1.validate(!this._traceInitializer, errors.initializerAlreadySet());
        utils_1.validate(context.name === 'init', errors.invalidInitializerName(context.name));
        this._traceInitializer = new procedures_1.AirProcedure(context, statements, result);
    }
    // TRANSITION FUNCTION
    // --------------------------------------------------------------------------------------------
    get transitionFunction() {
        utils_1.validate(this._transitionFunction, errors.transitionNotSet());
        return this._transitionFunction;
    }
    setTransitionFunction(context, statements, result) {
        utils_1.validate(!this._transitionFunction, errors.transitionAlreadySet());
        utils_1.validate(context.name === 'transition', errors.invalidTransitionName(context.name));
        this._transitionFunction = new procedures_1.AirProcedure(context, statements, result);
    }
    // TRANSITION CONSTRAINTS
    // --------------------------------------------------------------------------------------------
    get constraintEvaluator() {
        utils_1.validate(this._constraintEvaluator, errors.evaluatorNotSet());
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
        utils_1.validate(!this._constraintEvaluator, errors.evaluatorAlreadySet());
        utils_1.validate(context.name === 'evaluation', errors.invalidEvaluatorName(context.name));
        this._constraintEvaluator = new procedures_1.AirProcedure(context, statements, result);
    }
    // CODE GENERATION
    // --------------------------------------------------------------------------------------------
    toString() {
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
    validate() {
        const danglingInputs = this.getDanglingInputRegisters();
        utils_1.validate(danglingInputs.length === 0, errors.danglingInputRegisters(danglingInputs));
        utils_1.validate(this._traceInitializer, errors.transitionNotSet());
        utils_1.validate(this._transitionFunction, errors.transitionNotSet());
        utils_1.validate(this._constraintEvaluator, errors.evaluatorNotSet());
    }
    getDanglingInputRegisters() {
        const registers = new Set(this._inputRegisters);
        const leaves = this._inputRegisters.filter(r => r.isLeaf);
        for (let leaf of leaves) {
            let register = leaf;
            while (register) {
                registers.delete(register);
                register = register.parent !== undefined
                    ? this._inputRegisters[register.parent]
                    : undefined;
            }
        }
        const result = [];
        registers.forEach(r => result.push(this._inputRegisters.indexOf(r)));
        return result;
    }
}
exports.AirComponent = AirComponent;
// ERRORS
// ================================================================================================
const errors = {
    componentNameTooLong: (n) => `export name '${n}' is invalid: name length cannot exceed ${MAX_NAME_LENGTH} characters`,
    componentNameInvalid: (n) => `export name '${n}' is invalid`,
    cycleLengthNotInteger: (n) => `trace cycle length for export '${n}' is invalid: cycle length must be an integer`,
    cycleLengthTooSmall: (n) => `trace cycle length for export '${n}' is invalid: cycle length must be greater than 0`,
    cycleLengthNotPowerOf2: (n) => `trace cycle length for export '${n}' is invalid: cycle length must be a power of 2`,
    inputRegOutOfOrder: () => `input register cannot be preceded by other register types`,
    inputCycleTooBig: (c, t) => `input cycle length (${c}) cannot be greater than trace cycle length (${t})`,
    invalidInputParentIndex: (r, s) => `invalid parent for input register ${r}: register ${s} is undefined`,
    inputParentNotInputReg: (r, s) => `invalid parent for input register ${r}: register ${s} is not an input register`,
    inputParentIsLeafReg: (r, s) => `invalid parent for input register ${r}: register ${s} is a leaf register`,
    danglingInputRegisters: (d) => `cycle length for input registers ${d.join(', ')} is not defined`,
    maskRegOutOfOrder: () => `mask registers cannot be preceded by cyclic registers`,
    invalidMaskSourceIndex: (r, s) => `invalid source for mask register ${r}: register ${s} is undefined`,
    maskSourceNotInputReg: (r, s) => `invalid source for mask register ${r}: register ${s} is not an input register`,
    cyclicValuesTooMany: (t) => `number of values in cyclic register must be smaller than trace cycle length (${t})`,
    initializerNotSet: () => `trace initializer hasn't been set yet`,
    initializerAlreadySet: () => `trace initializer has already been set`,
    invalidInitializerName: (n) => `trace initializer cannot be set to a ${n} procedure`,
    transitionNotSet: () => `transition function hasn't been set yet`,
    transitionAlreadySet: () => `transition function has already been set`,
    invalidTransitionName: (n) => `transition function cannot be set to a ${n} procedure`,
    evaluatorNotSet: () => `constraint evaluator hasn't been set yet`,
    evaluatorAlreadySet: () => `constraint evaluator has already been set`,
    invalidEvaluatorName: (n) => `constraint evaluator cannot be set to a ${n} procedure`
};
//# sourceMappingURL=AirComponent.js.map