"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InputRegister_1 = require("./InputRegister");
const CyclicRegister_1 = require("./CyclicRegister");
const MaskRegister_1 = require("./MaskRegister");
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class StaticRegisterSet {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(traceCycleLength) {
        this.inputs = [];
        this.registers = [];
        this.traceCycleLength = traceCycleLength;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get size() {
        return this.registers.length;
    }
    get cyclic() {
        return this.registers.filter(r => r instanceof CyclicRegister_1.CyclicRegister);
    }
    get masked() {
        return this.registers.filter(r => r instanceof MaskRegister_1.MaskRegister);
    }
    // COLLECTION METHODS
    // --------------------------------------------------------------------------------------------
    get(index) {
        return this.registers[index];
    }
    map(callback) {
        return this.registers.map(callback);
    }
    forEach(callback) {
        this.registers.forEach(callback);
    }
    // UPDATE METHODS
    // --------------------------------------------------------------------------------------------
    addInput(scope, binary, parentIdx, steps, offset) {
        utils_1.validate(this.size === this.inputs.length, errors.inputRegOutOfOrder());
        let rank = 0;
        if (typeof parentIdx === 'number') {
            const parent = this.getParentInput(parentIdx);
            rank = parent.rank + 1;
        }
        else {
            rank = 1;
        }
        if (steps !== undefined) {
            utils_1.validate(steps <= this.traceCycleLength, errors.inputCycleTooBig(steps, this.traceCycleLength));
        }
        const register = new InputRegister_1.InputRegister(scope, rank, binary, parentIdx, steps, offset);
        this.inputs.push(register);
        this.registers.push(register);
    }
    addMask(source, inverted) {
        this.validateMaskSource(source, this.size);
        const lastRegister = this.registers[this.size - 1];
        utils_1.validate(!(lastRegister instanceof CyclicRegister_1.CyclicRegister), errors.maskRegOutOfOrder());
        const register = new MaskRegister_1.MaskRegister(source, inverted);
        this.registers.push(register);
    }
    addCyclic(values) {
        utils_1.validate(values.length <= this.traceCycleLength, errors.cyclicValuesTooMany(this.traceCycleLength));
        const register = new CyclicRegister_1.CyclicRegister(values);
        this.registers.push(register);
    }
    // OTHER PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    validate() {
        const danglingInputs = this.getDanglingInputs();
        utils_1.validate(danglingInputs.length === 0, errors.hasDanglingInputs(danglingInputs));
    }
    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    getParentInput(index) {
        const parent = this.inputs[index];
        if (!parent)
            throw new Error(`invalid parent register index: ${index}`);
        if (!(parent instanceof InputRegister_1.InputRegister))
            throw new Error(`register at index ${index} is not an input register`);
        if (parent.isLeaf)
            throw new Error(`register at index ${index} is a leaf register`);
        return parent;
    }
    validateMaskSource(sourceIdx, regIdx) {
        const source = this.inputs[sourceIdx];
        if (!source)
            throw new Error(`invalid source for mask register ${regIdx}: register ${sourceIdx} is undefined`);
        if (!(source instanceof InputRegister_1.InputRegister))
            throw new Error(`invalid source for mask register ${regIdx}: register ${sourceIdx} is not an input register`);
    }
    getDanglingInputs() {
        const registers = new Set(this.inputs);
        const leaves = this.inputs.filter(r => r.isLeaf);
        for (let leaf of leaves) {
            let register = leaf;
            while (register) {
                registers.delete(register);
                register = register.parent !== undefined ? this.inputs[register.parent] : undefined;
            }
        }
        const result = [];
        registers.forEach(r => result.push(this.inputs.indexOf(r)));
        return result;
    }
}
exports.StaticRegisterSet = StaticRegisterSet;
// ERRORS
// ================================================================================================
const errors = {
    inputRegOutOfOrder: () => `input register cannot be preceded by other register types`,
    inputCycleTooBig: (c, t) => `input cycle length (${c}) cannot be greater than trace cycle length (${t})`,
    maskRegOutOfOrder: () => `mask registers cannot be preceded by cyclic registers`,
    cyclicValuesTooMany: (t) => `number of values in cyclic register must be smaller than trace cycle length (${t})`,
    hasDanglingInputs: (i) => `cycle length for input registers ${i.join(', ')} is not defined`
};
//# sourceMappingURL=StaticRegisterSet.js.map