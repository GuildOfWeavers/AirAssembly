"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExecutionContext_1 = require("./ExecutionContext");
const expressions_1 = require("../../expressions");
const LocalVariable_1 = require("../LocalVariable");
const utils_1 = require("../../utils");
// CLASS DEFINITION
// ================================================================================================
class ProcedureContext extends ExecutionContext_1.ExecutionContext {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(name, schema, span, width) {
        super(schema);
        this.name = name;
        if (name === 'transition') {
            this.span = span;
            this.width = width;
            this.traceRegisters = new expressions_1.TraceSegment('trace', width);
            this.staticRegisters = new expressions_1.TraceSegment('static', schema.staticRegisterCount);
        }
        else if (name === 'evaluation') {
            this.span = span;
            this.width = width;
            this.traceRegisters = new expressions_1.TraceSegment('trace', schema.traceRegisterCount);
            this.staticRegisters = new expressions_1.TraceSegment('static', schema.staticRegisterCount);
        }
        else {
            throw new Error(`procedure name '${name}' is not valid`);
        }
    }
    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
    add(value) {
        if (value instanceof LocalVariable_1.LocalVariable) {
            // if local variable has a handle, set handle mapping
            if (value.handle) {
                utils_1.validate(!this.declarationMap.has(value.handle), errors.duplicateHandle(value.handle));
                this.declarationMap.set(value.handle, value);
            }
            // set index mapping and add local variable to the list
            this.declarationMap.set(`local::${this.locals.length}`, value);
            this.locals.push(value);
        }
        else {
            throw new Error(`${value} is not allowed in procedure context`);
        }
    }
    buildLoadExpression(operation, indexOrHandle) {
        if (operation === 'load.trace') {
            utils_1.validate(typeof indexOrHandle === 'number', errors.traceHandleInvalid(indexOrHandle));
            utils_1.validate(indexOrHandle < this.span, errors.traceOffsetInvalid(indexOrHandle, this.span));
            return new expressions_1.LoadExpression(this.traceRegisters, indexOrHandle);
        }
        else if (operation === 'load.static') {
            utils_1.validate(typeof indexOrHandle === 'number', errors.staticHandleInvalid(indexOrHandle));
            utils_1.validate(indexOrHandle === 0, errors.staticOffsetInvalid(indexOrHandle));
            return new expressions_1.LoadExpression(this.staticRegisters, indexOrHandle);
        }
        else {
            return super.buildLoadExpression(operation, indexOrHandle);
        }
    }
}
exports.ProcedureContext = ProcedureContext;
// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle: (h) => `handle ${h} cannot be declared multiple times`,
    traceHandleInvalid: (t) => `cannot load trace row ${t}: trace row offset must be an integer`,
    traceOffsetInvalid: (t, s) => `cannot load trace row ${t}: trace row offset must be smaller than ${s}`,
    staticHandleInvalid: (t) => `cannot load static row ${t}: static row offset must be an integer`,
    staticOffsetInvalid: (t) => `cannot load static row ${t}: static row offset must be 0`
};
//# sourceMappingURL=ProcedureContext.js.map