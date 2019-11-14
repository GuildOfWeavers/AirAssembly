"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class InputRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(index, scope, rank, binary, filling, parent, steps) {
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
    get type() {
        if (this.filling === 'sparse')
            return 1 /* sparseInput */;
        else
            return 2 /* filledInput */;
    }
    get isSecret() {
        return (this.scope === 'secret');
    }
    get isRoot() {
        return (this.parent === undefined);
    }
    get isLeaf() {
        return (this.steps === undefined);
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        const type = getTypeExpression(this.rank, this.parent);
        const binary = this.binary ? ` binary` : ``;
        const steps = (this.steps !== undefined) ? `(steps ${this.steps})` : '';
        return `(input ${this.scope}${binary} ${type} ${this.filling}${steps})`;
    }
}
exports.InputRegister = InputRegister;
// HELPER FUNCTIONS
// ================================================================================================
function getTypeExpression(rank, parent) {
    if (rank === 0)
        return 'scalar';
    else if (rank === 1)
        return 'vector';
    else {
        if (!parent)
            throw new Error(`TODO`);
        return `(parent ${parent.index})`;
    }
}
//# sourceMappingURL=InputRegister.js.map