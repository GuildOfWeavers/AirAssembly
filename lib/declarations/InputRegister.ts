// IMPORTS
// ================================================================================================
import { StaticRegisterType } from "@guildofweavers/air-assembly";

// CLASS DEFINITION
// ================================================================================================
export class InputRegister {

    readonly index          : number;
    readonly scope          : 'public' | 'secret';
    readonly rank           : number;
    readonly binary         : boolean;
    readonly filling        : `sparse` | 'filled';
    readonly parent?        : InputRegister;
    readonly steps?         : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(index: number, scope: string, rank: number, binary: boolean, filling: string, parent?: InputRegister, steps?: number) {
        if (scope !== 'public' && scope !== 'secret')
            throw new Error(`invalid input register scope '${scope}'`);
        if (filling !== 'sparse' && filling !== 'filled')
            throw new Error(`invalid input register filling '${filling}'`);

        this.index = index;
        this.scope = scope;
        this.rank = rank;
        this.binary = binary;
        this.filling = filling;
        this.parent = parent;
        this.steps = steps;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get type(): StaticRegisterType {
        if (this.filling === 'sparse')  return StaticRegisterType.sparseInput;
        else                            return StaticRegisterType.filledInput;
    }

    get isSecret(): boolean {
        return (this.scope === 'secret');
    }

    get isRoot(): boolean {
        return (this.parent === undefined);
    }

    get isLeaf(): boolean {
        return (this.steps === undefined);
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        const type = getTypeExpression(this.rank, this.parent);
        const binary = this.binary ? ` binary` : ``;
        const steps = (this.steps !== undefined) ? `(steps ${this.steps})` : '';
        return `(input ${this.scope}${binary} ${type} ${this.filling}${steps})`;
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function getTypeExpression(rank: number, parent?: InputRegister) {
    if (rank === 0) return 'scalar';
    else if (rank === 1) return 'vector';
    else {
        if (!parent) throw new Error(`TODO`);
        return `(parent ${parent.index})`;
    }
}