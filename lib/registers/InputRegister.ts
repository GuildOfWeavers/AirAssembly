// IMPORTS
// ================================================================================================
import { InputRegister as IInputRegister, InputRegisterMaster } from '@guildofweavers/air-assembly';
import { StaticRegister } from "./StaticRegister";
import { validate, isPowerOf2 } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class InputRegister extends StaticRegister implements IInputRegister {

    readonly secret     : boolean;
    readonly rank       : number;
    readonly binary     : boolean;
    readonly offset     : number;
    readonly master?    : InputRegisterMaster;
    readonly steps?     : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(scope: string, rank: number, binary: boolean, master?: InputRegisterMaster, steps?: number, offset = 0) {
        super();
        validate(scope === 'public' || scope === 'secret', errors.inputScopeInvalid(scope));
        validate(rank > 0, errors.inputRankTooSmall());
        validate(rank === 1 || master !== undefined, errors.inputRankInvalid(rank));
        if (steps !== undefined) {
            validate(isPowerOf2(steps), errors.stepsNotPowerOf2());
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
    get isRoot(): boolean {
        return (this.master === undefined);
    }

    get isLeaf(): boolean {
        return (this.steps !== undefined);
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        const scope = this.secret ? 'secret' : 'public';
        const master = this.master ? ` (${this.master.relation} ${this.master.index})` : '';
        const binary = this.binary ? ' binary' :'';
        const offset = this.offset === 0 ? '' : ` (shift ${this.offset})`;
        const steps = (this.steps !== undefined) ? ` (steps ${this.steps})` : '';
        return `(input ${scope}${binary}${master}${steps}${offset})`;
    }
}

// ERRORS
// ================================================================================================
const errors = {
    inputScopeInvalid   : (s: any) => `input register scope '${s}' is not valid`,
    inputRankInvalid    : (r: any) => `invalid input register rank: register of rank ${r} has no master`,
    inputRankTooSmall   : () => `input register rank must be greater than 0`,
    stepsNotPowerOf2    : () => `input register cycle length must be a power of 2`
};