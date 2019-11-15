// IMPORTS
// ================================================================================================
import { StaticRegister } from "@guildofweavers/air-assembly";
import { InputRegister } from "./InputRegister";
import { CyclicRegister } from "./CyclicRegister";
import { MaskRegister } from "./MaskRegister";

// CLASS DEFINITION
// ================================================================================================
export class StaticRegisterSet {

    readonly inputs     : InputRegister[];
    readonly registers  : StaticRegister[];

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor () {
        this.inputs = [];
        this.registers = [];
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get size(): number {
        return this.registers.length;
    }

    // COLLECTION METHODS
    // --------------------------------------------------------------------------------------------
    get(index: number): StaticRegister {
        return this.registers[index];
    }

    map<T>(callback: (register: StaticRegister, index: number) => T): T[] {
        return this.registers.map(callback);
    }

    forEach(callback: (register: StaticRegister, index: number) => void): void {
        this.registers.forEach(callback);
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    addInput(scope: string, binary: boolean, typeOrParent: string | number, steps?: number): void {
        if (this.size > this.inputs.length)
            throw new Error(`input register cannot be preceded by other register types`);

        let rank = 0, parentIdx: number | undefined;
        if (typeof typeOrParent === 'number') {
            const parent = this.getParentInput(typeOrParent);
            rank = parent.rank + 1;
            parentIdx = parent.index;
        }
        else if (typeOrParent === 'vector') {
            rank = 1;
        }
    
        const register = new InputRegister(this.size, scope, rank, binary, parentIdx, steps);
        this.inputs.push(register);
        this.registers.push(register);
    }

    addCyclic(values: bigint[]): void {
        const register = new CyclicRegister(this.size, values);
        this.registers.push(register);
    }

    addMask(source: number, value: bigint): void {
        this.validateMaskSource(source);
        const register = new MaskRegister(this.size, source, value);
        this.registers.push(register);
    }

    toString() {
        if (this.size === 0) return '';
        return `\n  (static\n    ${this.registers.map(r => r.toString()).join('\n    ')})`;
    }

    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    private getParentInput(index: number): InputRegister {
        const parent = this.inputs[index];
        if (!parent) throw new Error(`invalid parent register index: ${index}`);
        if (!(parent instanceof InputRegister))
            throw new Error(`register at index ${index} is not an input register`);
        if (parent.isLeaf)
            throw new Error(`register at index ${index} is a leaf register`);
        return parent;
    }

    private validateMaskSource(index: number): void {
        const source = this.inputs[index];
        if (!source) throw new Error(`invalid source register index: ${index}`);
        if (!(source instanceof InputRegister))
            throw new Error(`register at index ${index} is not an input register`);
    }
}