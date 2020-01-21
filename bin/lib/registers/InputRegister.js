"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StaticRegister_1 = require("./StaticRegister");
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class InputRegister extends StaticRegister_1.StaticRegister {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(scope, rank, binary, master, steps, offset = 0) {
        super();
        utils_1.validate(scope === 'public' || scope === 'secret', errors.inputScopeInvalid(scope));
        utils_1.validate(rank > 0, errors.inputRankTooSmall());
        utils_1.validate(rank === 1 || master !== undefined, errors.inputRankInvalid(rank));
        if (steps !== undefined) {
            utils_1.validate(utils_1.isPowerOf2(steps), errors.stepsNotPowerOf2());
        }
        this.secret = (scope === 'secret');
        this.rank = rank;
        this.binary = binary;
        this.offset = offset;
        this.master = master;
        this.steps = steps;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get isRoot() {
        return (this.master === undefined);
    }
    get isPeer() {
        return (this.master !== undefined && this.master.relation === 'peerof');
    }
    get isLeaf() {
        return (this.steps !== undefined && !this.isPeer);
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        const scope = this.secret ? 'secret' : 'public';
        const master = this.master ? ` (${this.master.relation} ${this.master.index})` : '';
        const binary = this.binary ? ' binary' : '';
        const offset = this.offset === 0 ? '' : ` (shift ${this.offset})`;
        const steps = (this.steps !== undefined) ? ` (steps ${this.steps})` : '';
        return `(input ${scope}${binary}${master}${steps}${offset})`;
    }
}
exports.InputRegister = InputRegister;
// ERRORS
// ================================================================================================
const errors = {
    inputScopeInvalid: (s) => `input register scope '${s}' is not valid`,
    inputRankInvalid: (r) => `invalid input register rank: register of rank ${r} has no master`,
    inputRankTooSmall: () => `input register rank must be greater than 0`,
    stepsNotPowerOf2: () => `input register cycle length must be a power of 2`
};
//# sourceMappingURL=InputRegister.js.map