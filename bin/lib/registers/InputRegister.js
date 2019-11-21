"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const StaticRegister_1 = require("./StaticRegister");
// CLASS DEFINITION
// ================================================================================================
class InputRegister extends StaticRegister_1.StaticRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(scope, rank, binary, rotation, parent, steps) {
        super();
        if (scope !== 'public' && scope !== 'secret')
            throw new Error(`invalid input register scope '${scope}'`);
        else if (rank > 1 && parent === undefined)
            throw new Error(`invalid input register rank: register of rank ${rank} has no parent`);
        this.secret = (scope === 'secret');
        this.rank = rank;
        this.binary = binary;
        this.rotation = rotation;
        this.parent = parent;
        this.steps = steps;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get isRoot() {
        return (this.parent === undefined);
    }
    get isLeaf() {
        return (this.steps !== undefined);
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        const scope = this.secret ? 'secret' : 'public';
        const type = getTypeExpression(this.rank, this.parent);
        const binary = this.binary ? ` binary` : ``;
        const rotation = getRotationExpression(this.rotation);
        const steps = (this.steps !== undefined) ? ` (steps ${this.steps})` : '';
        return `(input ${scope}${binary} ${type}${steps}${rotation})`;
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
    else
        return `(parent ${parent})`;
}
function getRotationExpression(rotation) {
    if (rotation === 0)
        return '';
    else if (rotation < 0)
        return ` (bshift ${-rotation})`;
    else
        return ` (fshift ${rotation})`;
}
//# sourceMappingURL=InputRegister.js.map