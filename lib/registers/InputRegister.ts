// IMPORTS
// ================================================================================================
import { StaticRegister } from "./StaticRegister";

// CLASS DEFINITION
// ================================================================================================
export class InputRegister extends StaticRegister {

    readonly secret     : boolean;
    readonly rank       : number;
    readonly binary     : boolean;
    readonly offset     : number;
    readonly parent?    : number;
    readonly steps?     : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(scope: string, rank: number, binary: boolean, offset: number, parent?: number, steps?: number) {
        super();
        if (scope !== 'public' && scope !== 'secret')
            throw new Error(`invalid input register scope '${scope}'`);
        else if (rank > 1 && parent === undefined)
            throw new Error(`invalid input register rank: register of rank ${rank} has no parent`);

        this.secret = (scope === 'secret');
        this.rank = rank;
        this.binary = binary;
        this.offset = offset;
        this.parent = parent;
        this.steps = steps;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
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
        const offset = getOffsetExpression(this.offset);
        const steps = (this.steps !== undefined) ? ` (steps ${this.steps})` : '';
        return `(input ${scope}${binary} ${type}${steps}${offset})`;
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function getTypeExpression(rank: number, parent?: number) {
    if (rank === 0) return 'scalar';
    else if (rank === 1) return 'vector';
    else return `(parent ${parent})`;
}

function getOffsetExpression(offset: number) {
    if (offset === 0) return '';
    else return ` (shift ${offset})`;
}