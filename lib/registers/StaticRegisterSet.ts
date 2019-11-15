// IMPORTS
// ================================================================================================
import { StaticRegister } from "@guildofweavers/air-assembly";
import { InputRegister } from "./InputRegister";
import { CyclicRegister } from "./CyclicRegister";

// CLASS DEFINITION
// ================================================================================================
export class StaticRegisterSet {

    readonly inputs : InputRegister[];
    readonly cyclic : CyclicRegister[];

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor () {
        this.inputs = [];
        this.cyclic = [];
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get size(): number {
        return this.inputs.length + this.cyclic.length;
    }

    get(index: number): StaticRegister {
        if (index < this.inputs.length) return this.inputs[index];
        index -= this.inputs.length;
        return this.cyclic[index];
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
    }

    addCyclic(values: bigint[]): void {
        const register = new CyclicRegister(this.size, values);
        this.cyclic.push(register);
    }

    toString() {
        if (this.size === 0) return '';
        const registers = [...this.inputs, ...this.cyclic];
        return `\n  (static\n    ${registers.map(r => r.toString()).join('\n    ')})`;
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
}