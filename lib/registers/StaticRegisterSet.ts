// IMPORTS
// ================================================================================================
import { StaticRegisterSet as IStaticRegisterSet } from '@guildofweavers/air-assembly';
import { StaticRegister } from "./StaticRegister";
import { InputRegister } from "./InputRegister";
import { CyclicRegister } from "./CyclicRegister";
import { MaskRegister } from "./MaskRegister";
import { PrngSequence } from './PrngSequence';
import { validate } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class StaticRegisterSet implements IStaticRegisterSet {

    readonly inputs             : InputRegister[];
    readonly registers          : StaticRegister[];
    readonly traceCycleLength   : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor (traceCycleLength: number) {
        this.inputs = [];
        this.registers = [];
        this.traceCycleLength = traceCycleLength;
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
    addInput(scope: string, binary: boolean, parentIdx?: number, steps?: number, offset?: number): void {
        validate(this.size === this.inputs.length, errors.inputRegOutOfOrder());

        let rank = 0;
        if (typeof parentIdx === 'number') {
            const parent = this.getParentInput(parentIdx);
            rank = parent.rank + 1;
        }
        else {
            rank = 1;
        }

        if (steps !== undefined) {
            validate(steps <= this.traceCycleLength, errors.inputCycleTooBig(steps, this.traceCycleLength));
        }
    
        const register = new InputRegister(scope, rank, binary, parentIdx, steps, offset);
        this.inputs.push(register);
        this.registers.push(register);
    }

    addMask(source: number, inverted: boolean): void {
        this.validateMaskSource(source, this.size);
        const lastRegister = this.registers[this.size - 1];
        validate(!(lastRegister instanceof CyclicRegister), errors.maskRegOutOfOrder());
        const register = new MaskRegister(source, inverted);
        this.registers.push(register);
    }

    addCyclic(values: bigint[] | PrngSequence): void {
        validate(values.length <= this.traceCycleLength, errors.cyclicValuesTooMany(this.traceCycleLength));
        const register = new CyclicRegister(values);
        this.registers.push(register);
    }

    // OTHER PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    validate() {
        const danglingInputs = this.getDanglingInputs();
        validate(danglingInputs.length === 0, errors.hasDanglingInputs(danglingInputs));
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

    private getDanglingInputs(): number[] {
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
}

// ERRORS
// ================================================================================================
const errors = {
    inputRegOutOfOrder  : () => `input register cannot be preceded by other register types`,
    inputCycleTooBig    : (c: any, t: any) => `input cycle length (${c}) cannot be greater than trace cycle length (${t})`,
    maskRegOutOfOrder   : () => `mask registers cannot be preceded by cyclic registers`,
    cyclicValuesTooMany : (t: any) => `number of values in cyclic register must be smaller than trace cycle length (${t})`,
    hasDanglingInputs   : (i: any) => `cycle length for input registers ${i.join(', ')} is not defined`
};