"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InputRegister_1 = require("./InputRegister");
const CyclicRegister_1 = require("./CyclicRegister");
// CLASS DEFINITION
// ================================================================================================
class StaticRegisterSet {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor() {
        this.inputs = [];
        this.cyclic = [];
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get size() {
        return this.inputs.length + this.cyclic.length;
    }
    get(index) {
        if (index < this.inputs.length)
            return this.inputs[index];
        index -= this.inputs.length;
        return this.cyclic[index];
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
    }
    addCyclic(values) {
        const register = new CyclicRegister_1.CyclicRegister(this.size, values);
        this.cyclic.push(register);
    }
    toString() {
        if (this.size === 0)
            return '';
        const registers = [...this.inputs, ...this.cyclic];
        return `\n  (static\n    ${registers.map(r => r.toString()).join('\n    ')})`;
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
}
exports.StaticRegisterSet = StaticRegisterSet;
//# sourceMappingURL=StaticRegisterSet.js.map