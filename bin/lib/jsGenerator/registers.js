"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const registers_1 = require("../registers");
// CLASS DEFINITION
// ================================================================================================
class StaticRegisters {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(registers) {
        this.inputRegisters = [];
        this.cyclicRegisters = [];
        this.maskedRegisters = [];
        for (let register of registers) {
            if (register instanceof registers_1.InputRegister) {
                this.inputRegisters.push({
                    rank: register.rank,
                    parent: register.parent,
                    secret: register.secret,
                    binary: register.binary,
                    steps: register.steps
                });
            }
            else if (register instanceof registers_1.CyclicRegister) {
                this.cyclicRegisters.push({ type: 'cyclic', values: register.values, secret: false });
            }
            else if (register instanceof registers_1.MaskRegister) {
                this.maskedRegisters.push({ source: register.source, value: register.value });
            }
        }
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get size() {
        return this.inputRegisters.length + this.cyclicRegisters.length + this.maskedRegisters.length;
    }
    get inputDescriptors() {
        return this.inputRegisters;
    }
    // INPUT HANDLERS
    // --------------------------------------------------------------------------------------------
    digestInputs(inputs) {
        let specs = [];
        // build input register descriptors
        const shapes = new Array(this.inputRegisters.length);
        this.inputRegisters.forEach((register, i) => {
            shapes[i] = (register.parent === undefined) ? [1] : shapes[register.parent].slice(0);
            let values = unrollRegisterValues(inputs[i], i, register.rank, 0, shapes[i]);
            if (register.binary)
                validateBinaryValues(values, i);
            specs.push({ type: 'input', shape: shapes[i], values, secret: register.secret });
        });
        // append cyclic register descriptors
        specs = specs.concat(this.cyclicRegisters);
        // build and append masked register descriptors
        this.maskedRegisters.forEach(register => specs.push({
            type: 'mask',
            values: new Array(specs[register.source].values.length).fill(register.value),
            secret: false
        }));
        const traceLength = this.computeTraceLength(shapes);
        return { traceLength, registerSpecs: specs };
    }
    digestPublicInputs(inputs, shapes) {
        let specs = [], inputIdx = 0;
        shapes.forEach((shape, regIdx) => {
            const register = this.inputRegisters[regIdx];
            if (register.secret) {
                specs.push(undefined);
            }
            else {
                let values = unrollRegisterValues(inputs[inputIdx], regIdx, register.rank, 0, shape);
                if (register.binary)
                    validateBinaryValues(values, regIdx);
                specs.push({ type: 'input', shape, values, secret: false });
                inputIdx++;
            }
        });
        const traceLength = this.computeTraceLength(shapes);
        return { traceLength, registerSpecs: specs };
    }
    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    computeTraceLength(shapes) {
        let result = 0;
        this.inputRegisters.forEach((register, i) => {
            if (register.steps) {
                const traceLength = shapes[i].reduce((p, c) => p * c, register.steps);
                if (result === 0) {
                    result = traceLength;
                }
                else if (result !== traceLength) {
                    throw new Error(`trace length conflict`); // TODO: better error message
                }
            }
        });
        return result;
    }
}
exports.StaticRegisters = StaticRegisters;
// HELPER FUNCTIONS
// ================================================================================================
function unrollRegisterValues(value, regIdx, rank, depth, shape) {
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
        else if (!utils_1.isPowerOf2(value.length))
            throw new Error(`number of values for register ${regIdx} at depth ${depth} must be a power of 2`);
        depth++;
        if (shape[depth] === undefined) {
            shape[depth] = value.length;
        }
        else if (value.length !== shape[depth]) {
            throw new Error(`values provided for register ${regIdx} do not match the expected signature`);
        }
        let result = [];
        for (let i = 0; i < value.length; i++) {
            result = [...result, ...unrollRegisterValues(value[i], regIdx, rank, depth, shape)];
        }
        return result;
    }
}
function validateBinaryValues(values, regIdx) {
    // TODO: implement
}
//# sourceMappingURL=registers.js.map