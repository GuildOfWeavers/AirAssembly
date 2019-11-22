// IMPORTS
// ================================================================================================
import { registers } from '@guildofweavers/air-assembly';
import { StaticRegister } from "./StaticRegister";
import { InputRegister } from "./InputRegister";
import { CyclicRegister } from "./CyclicRegister";
import { MaskRegister } from "./MaskRegister";
import { isPowerOf2 } from "../utils";
import { PrngSequence } from './PrngSequence';

// CLASS DEFINITION
// ================================================================================================
export class StaticRegisterSet implements registers.StaticRegisterSet {

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

    get cyclic(): CyclicRegister[] {
        return this.registers.filter(r => r instanceof CyclicRegister) as CyclicRegister[];
    }

    get masked(): MaskRegister[] {
        return this.registers.filter(r => r instanceof MaskRegister) as MaskRegister[];
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

    // UPDATE METHODS
    // --------------------------------------------------------------------------------------------
    addInput(scope: string, binary: boolean, typeOrParent: string | number, rotation: number, steps?: number): void {
        if (this.size > this.inputs.length)
            throw new Error(`input register cannot be preceded by other register types`);

        let rank = 0, parentIdx: number | undefined;
        if (typeof typeOrParent === 'number') {
            const parent = this.getParentInput(typeOrParent);
            rank = parent.rank + 1;
            parentIdx = typeOrParent;
        }
        else if (typeOrParent === 'vector') {
            rank = 1;
        }
    
        const register = new InputRegister(scope, rank, binary, rotation, parentIdx, steps);
        this.inputs.push(register);
        this.registers.push(register);
    }

    addMask(source: number, inverted: boolean): void {
        this.validateMaskSource(source, this.size);
        if (this.registers[this.size - 1] instanceof CyclicRegister)
            throw new Error(`mask registers cannot be preceded by cyclic registers`);
        const register = new MaskRegister(source, inverted);
        this.registers.push(register);
    }

    addCyclic(values: bigint[] | PrngSequence): void {
        if (!isPowerOf2(values.length))
            throw new Error(`number of values in cyclic register ${this.size} is ${values.length}, but must be a power of 2`);
        const register = new CyclicRegister(values);
        this.registers.push(register);
    }

    // OTHER PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getDanglingInputs(): number[] {
        const registers = new Set<InputRegister>(this.inputs);
        const leaves = this.inputs.filter(r => r.isLeaf);

        for (let leaf of leaves) {
            let register : InputRegister | undefined = leaf;
            while (register) {
                registers.delete(register);
                register = register.parent !== undefined ? this.inputs[register.parent] : undefined;
            }
        }

        const result: number[] = [];
        registers.forEach(r => result.push(this.inputs.indexOf(r)));
        return result;
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

    private validateMaskSource(sourceIdx: number, regIdx: number): void {
        const source = this.inputs[sourceIdx];
        if (!source)
            throw new Error(`invalid source for mask register ${regIdx}: register ${sourceIdx} is undefined`);
        if (!(source instanceof InputRegister))
            throw new Error(`invalid source for mask register ${regIdx}: register ${sourceIdx} is not an input register`);
    }
}