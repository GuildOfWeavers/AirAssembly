// IMPORTS
// ================================================================================================
import { StaticRegisterType, StaticRegisterDescriptor } from "@guildofweavers/air-assembly";
import { InputRegister } from "../declarations";
import { isPowerOf2 } from "../utils";

// INTERFACES
// ================================================================================================
interface InputRegisterDescriptor {
    readonly index      : number;
    readonly type       : StaticRegisterType;
    readonly rank       : number;
    readonly binary     : boolean;
    readonly secret     : boolean;
    readonly parent?    : number;
    readonly cycle?     : number;
}

// CLASS DEFINITION
// ================================================================================================
export class InputProcessor {

    readonly registers  : InputRegisterDescriptor[];
    readonly levels     : InputRegisterDescriptor[][];

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(registers: InputRegister[]) {
        this.registers = registers.map(register => ({
            index   : register.index,
            type    : register.type,
            rank    : register.rank,
            secret  : register.isSecret,
            binary  : register.binary,
            cycle   : register.steps,
            parent  : register.parent ? register.parent.index : undefined
        }));

        const maxRank = this.registers.reduce((p, c) => c.rank > p ? c.rank : p, 0);
        this.levels = [];
        for (let i = 0; i <= maxRank; i++) {
            this.levels.push(this.registers.filter(r => r.rank === i));
        }
    }

    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
    digest(inputs: any[]): { traceLength: number; registers: StaticRegisterDescriptor[]; } {
        const shapes = new Array<number[]>(this.registers.length);
        const values = new Array<bigint[]>(this.registers.length);
    
        for (let i = 0; i < this.levels.length; i++) {
            let registers = this.levels[i];
            for (let { index, rank, parent, binary } of registers) {
                shapes[index] = (parent === undefined) ? [1] : shapes[parent].slice(0);
                values[index] = unrollRegisterValues(inputs[index], index, rank, 0, shapes[index]);
                if (binary) {
                    validateBinaryValues(values[index], index);
                }
            }
        }
    
        const leafRegisters = this.levels[this.levels.length - 1];
        const traceLength = values[leafRegisters[0].index].length * leafRegisters[0].cycle!;
        for (let i = 1; i < leafRegisters.length; i++) {
            if (values[leafRegisters[i].index].length * leafRegisters[0].cycle! !== traceLength) {
                throw new Error('TODO');
            }
        }

        const registers = this.registers.map((register, i) => ({
            type    : register.type,
            shape   : shapes[i],
            values  : values[i],
            secret  : register.secret
        }));

        return { traceLength, registers };
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function unrollRegisterValues(value: any[] | bigint, regIdx: number, rank: number, depth: number, shape: number[]): bigint[] {
    if (typeof value === 'bigint') {
        if (depth !== rank)
            throw new Error(`values provided for register ${regIdx} do not match the expected signature`);
        return [value];
    }
    else {
        if (depth === rank)
            throw new Error(`values provided for register ${regIdx} do not match the expected signature`);
        if (!Array.isArray(value))
            throw new Error(`value provided for register ${regIdx} at depth ${depth} is invalid`);
        else if (value.length === 0)
            throw new Error(`number of values for register ${regIdx} at depth ${depth} must be greater than 0`);
        else if (!isPowerOf2(value.length)) 
            throw new Error(`number of values for register ${regIdx} at depth ${depth} must be a power of 2`);

        depth++;
        if (shape[depth] === undefined) {
            shape[depth] = value.length;
        }
        else if (value.length !== shape[depth]) {
            throw new Error(`values provided for register ${regIdx} do not match the expected signature`);
        }

        let result: bigint[] = [];
        for (let i = 0; i < value.length; i++) {
            result = [...result, ...unrollRegisterValues(value[i], regIdx, rank, depth, shape)];
        }
        return result;
    }
}

function validateBinaryValues(values: bigint[], regIdx: number): void {
    // TODO: implement
}