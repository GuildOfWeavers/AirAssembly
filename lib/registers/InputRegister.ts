// IMPORTS
// ================================================================================================
import { InputRegister as IInputRegister } from "@guildofweavers/air-assembly";

// CLASS DEFINITION
// ================================================================================================
export class InputRegister implements IInputRegister {

    readonly index          : number;
    readonly secret         : boolean;
    readonly rank           : number;
    readonly binary         : boolean;
    readonly parent?        : number;
    readonly steps?         : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(index: number, scope: string, rank: number, binary: boolean, parent?: number, steps?: number) {
        if (scope !== 'public' && scope !== 'secret')
            throw new Error(`invalid input register scope '${scope}'`);
        
        this.index = index;
        this.secret = (scope === 'secret');
        this.rank = rank;
        this.binary = binary;
        this.parent = parent;
        this.steps = steps;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get type(): 'input' {
        return 'input';
    }

    get isRoot(): boolean {
        return (this.parent === undefined);
    }

    get isLeaf(): boolean {
        return (this.steps !== undefined);
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        const scope = this.secret ? 'secret' : 'public';
        const type = getTypeExpression(this.rank, this.parent);
        const binary = this.binary ? ` binary` : ``;
        const steps = (this.steps !== undefined) ? ` (steps ${this.steps})` : '';
        return `(input ${scope}${binary} ${type}${steps})`;
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function getTypeExpression(rank: number, parent?: number) {
    if (rank === 0) return 'scalar';
    else if (rank === 1) return 'vector';
    else {
        if (parent === undefined) throw new Error(`TODO`);
        return `(parent ${parent})`;
    }
}