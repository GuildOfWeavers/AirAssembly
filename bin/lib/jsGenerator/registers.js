"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class StaticRegisters {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(registers) {
        // process input registers
        this.inputRegisters = registers.inputs.map(r => ({
            index: r.index,
            rank: r.rank,
            parent: r.parent,
            secret: r.secret,
            binary: r.binary,
            steps: r.steps
        }));
        const maxRank = this.inputRegisters.reduce((p, c) => c.rank > p ? c.rank : p, 0);
        this.rankedInputs = [];
        for (let i = 0; i <= maxRank; i++) {
            this.rankedInputs.push(this.inputRegisters.filter(r => r.rank === i));
        }
        // process cyclic registers
        this.cyclicRegisters = registers.cyclic.map(r => {
            // make sure the length of values is at least 4; this is needed for FFT interpolation
            let values = r.values;
            while (values.length < 4)
                values = values.concat(values);
            return { type: 'cyclic', values, secret: false };
        });
        // process mask registers
        this.maskedRegisters = registers.masked.map(r => ({
            source: r.source,
            value: r.value
        }));
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get size() {
        return this.inputRegisters.length + this.cyclicRegisters.length + this.maskedRegisters.length;
    }
    // INPUT HANDLERS
    // --------------------------------------------------------------------------------------------
    digestInputs(inputs) {
        // determine input shapes and values
        const shapes = new Array(this.inputRegisters.length);
        const values = new Array(this.inputRegisters.length);
        for (let i = 0; i < this.rankedInputs.length; i++) {
            let registers = this.rankedInputs[i];
            for (let { index, rank, parent, binary } of registers) {
                shapes[index] = (parent === undefined) ? [1] : shapes[parent].slice(0);
                values[index] = unrollRegisterValues(inputs[index], index, rank, 0, shapes[index]);
                if (binary)
                    validateBinaryValues(values[index], index);
            }
        }
        // build input register descriptors
        let registerSpecs = this.inputRegisters.map((r, i) => ({
            type: 'input',
            shape: shapes[i],
            values: values[i],
            secret: r.secret
        }));
        // append cyclic register descriptors
        registerSpecs = registerSpecs.concat(this.cyclicRegisters);
        // build and append masked register descriptors
        this.maskedRegisters.forEach(r => registerSpecs.push({
            type: 'mask',
            values: new Array(values[r.source].length).fill(r.value),
            secret: false
        }));
        const traceLength = this.computeTraceLength(shapes);
        return { traceLength, registerSpecs };
    }
    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    computeTraceLength(shapes) {
        const leafRegisters = this.rankedInputs[this.rankedInputs.length - 1];
        let register = leafRegisters[0];
        const traceLength = shapes[register.index].reduce((p, c) => p * c, register.steps);
        for (let i = 1; i < leafRegisters.length; i++) {
            register = leafRegisters[i];
            if (shapes[register.index].reduce((p, c) => p * c, register.steps) !== traceLength) {
                throw new Error(`trace length conflict`); // TODO: better error message
            }
        }
        return traceLength;
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