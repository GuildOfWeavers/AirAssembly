"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StaticRegister_1 = require("./StaticRegister");
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class InputRegister extends StaticRegister_1.StaticRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(scope, rank, binary, parent, steps, offset = 0) {
        super();
        utils_1.validate(scope === 'public' || scope === 'secret', errors.inputScopeInvalid(scope));
        utils_1.validate(rank > 0, errors.inputRankTooSmall());
        utils_1.validate(rank === 1 || parent !== undefined, errors.inputRankInvalid(rank));
        if (steps !== undefined) {
            utils_1.validate(utils_1.isPowerOf2(steps), errors.stepsNotPowerOf2());
        }
        this.secret = (scope === 'secret');
        this.rank = rank;
        this.binary = binary;
        this.offset = offset;
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
        const parent = this.parent === undefined ? '' : ` (parent ${this.parent})`;
        const binary = this.binary ? ' binary' : '';
        const offset = this.offset === 0 ? '' : ` (shift ${this.offset})`;
        const steps = (this.steps !== undefined) ? ` (steps ${this.steps})` : '';
        return `(input ${scope}${binary}${parent}${steps}${offset})`;
    }
}
exports.InputRegister = InputRegister;
// ERRORS
// ================================================================================================
const errors = {
    inputScopeInvalid: (s) => `input register scope '${s}' is not valid`,
    inputRankInvalid: (r) => `invalid input register rank: register of rank ${r} has no parent`,
    inputRankTooSmall: () => `input register rank must be greater than 0`,
    stepsNotPowerOf2: () => `input register cycle length must be a power of 2`
};
//# sourceMappingURL=InputRegister.js.map