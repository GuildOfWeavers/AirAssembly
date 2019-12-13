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
    constructor(name, component) {
        super(component.field, component.constants, component.functions);
        this.name = name;
        if (name === 'init' || name === 'transition') {
            this.width = component.traceRegisterCount;
        }
        else if (name === 'evaluation') {
            this.width = component.constraintCount;
        }
        else {
            throw new Error(`procedure name '${name}' is not valid`);
        }
        this.traceRegisters = new expressions_1.TraceSegment('trace', component.traceRegisterCount);
        this.staticRegisters = new expressions_1.TraceSegment('static', component.staticRegisterCount);
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
            this.validateTraceAccess(indexOrHandle);
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
    // PRIVATE FUNCTION
    // --------------------------------------------------------------------------------------------
    validateTraceAccess(offset) {
        if (this.name === 'init') {
            throw new Error(`cannot load trace row: trace table cannot be accessed in init procedures`);
        }
        else if (this.name === 'transition') {
            utils_1.validate(offset === 0, `cannot load trace row ${offset}: trace row offset cannot be greater than 0`);
        }
        else if (this.name === 'evaluation') {
            utils_1.validate(offset <= 1, `cannot load trace row ${offset}: trace row offset cannot be greater than 1`);
        }
    }
}
exports.ProcedureContext = ProcedureContext;
// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle: (h) => `handle ${h} cannot be declared multiple times`,
    traceHandleInvalid: (t) => `cannot load trace row ${t}: trace row offset must be an integer`,
    staticHandleInvalid: (t) => `cannot load static row ${t}: static row offset must be an integer`,
    staticOffsetInvalid: (t) => `cannot load static row ${t}: static row offset must be 0`
};
//# sourceMappingURL=ProcedureContext.js.map