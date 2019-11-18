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
    constructor() {
        this.inputs = [];
        this.registers = [];
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
    addInput(scope, binary, typeOrParent, steps) {
        if (this.size > this.inputs.length)
            throw new Error(`input register cannot be preceded by other register types`);
        let rank = 0, parentIdx;
        if (typeof typeOrParent === 'number') {
            const parent = this.getParentInput(typeOrParent);
            rank = parent.rank + 1;
            parentIdx = typeOrParent;
        }
        else if (typeOrParent === 'vector') {
            rank = 1;
        }
        const register = new InputRegister_1.InputRegister(scope, rank, binary, parentIdx, steps);
        this.inputs.push(register);
        this.registers.push(register);
    }
    addCyclic(values) {
        if (!utils_1.isPowerOf2(values.length))
            throw new Error(`number of values in cyclic register ${this.size} is ${values.length}, but must be a power of 2`);
        const register = new CyclicRegister_1.CyclicRegister(values);
        this.registers.push(register);
    }
    addMask(source, value) {
        this.validateMaskSource(source, this.size);
        const register = new MaskRegister_1.MaskRegister(source, value);
        this.registers.push(register);
    }
    // OTHER PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getDanglingInputs() {
        // TODO: implement
        return [];
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
}
exports.StaticRegisterSet = StaticRegisterSet;
//# sourceMappingURL=StaticRegisterSet.js.map