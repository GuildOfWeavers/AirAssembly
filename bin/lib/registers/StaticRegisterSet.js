"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InputRegister_1 = require("./InputRegister");
const CyclicRegister_1 = require("./CyclicRegister");
const MaskRegister_1 = require("./MaskRegister");
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
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    addInput(scope, binary, typeOrParent, steps) {
        if (this.size > this.inputs.length)
            throw new Error(`input register cannot be preceded by other register types`);
        let rank = 0, parentIdx;
        if (typeof typeOrParent === 'number') {
            const parent = this.getParentInput(typeOrParent);
            rank = parent.rank + 1;
            parentIdx = parent.index;
        }
        else if (typeOrParent === 'vector') {
            rank = 1;
        }
        const register = new InputRegister_1.InputRegister(this.size, scope, rank, binary, parentIdx, steps);
        this.inputs.push(register);
        this.registers.push(register);
    }
    addCyclic(values) {
        const register = new CyclicRegister_1.CyclicRegister(this.size, values);
        this.registers.push(register);
    }
    addMask(source, value) {
        this.validateMaskSource(source);
        const register = new MaskRegister_1.MaskRegister(this.size, source, value);
        this.registers.push(register);
    }
    toString() {
        if (this.size === 0)
            return '';
        return `\n  (static\n    ${this.registers.map(r => r.toString()).join('\n    ')})`;
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
    validateMaskSource(index) {
        const source = this.inputs[index];
        if (!source)
            throw new Error(`invalid source register index: ${index}`);
        if (!(source instanceof InputRegister_1.InputRegister))
            throw new Error(`register at index ${index} is not an input register`);
    }
}
exports.StaticRegisterSet = StaticRegisterSet;
//# sourceMappingURL=StaticRegisterSet.js.map