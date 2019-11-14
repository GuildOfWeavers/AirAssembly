"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class InputRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(index, scope, rank, binary, parent, steps) {
        if (scope !== 'public' && scope !== 'secret')
            throw new Error(`invalid input register scope '${scope}'`);
        this.index = index;
        this.secret = (scope === 'secret');
        this.rank = rank;
        this.binary = binary;
        this.parent = parent ? parent.index : undefined;
        this.steps = steps;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get type() {
        return 'input';
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
        const scope = this.secret ? 'secret' : 'public';
        const type = getTypeExpression(this.rank, this.parent);
        const binary = this.binary ? ` binary` : ``;
        const steps = (this.steps !== undefined) ? ` (steps ${this.steps})` : '';
        return `(input ${scope}${binary} ${type}${steps})`;
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
        if (parent === undefined)
            throw new Error(`TODO`);
        return `(parent ${parent})`;
    }
}
//# sourceMappingURL=InputRegister.js.map