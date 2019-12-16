"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExecutionContext_1 = require("./ExecutionContext");
const expressions_1 = require("../../expressions");
const Parameter_1 = require("../Parameter");
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
    addParam(dimensions, handle) {
        utils_1.validate(this.params.length === 0, errors.tooManyInitParams());
        utils_1.validate(expressions_1.Dimensions.isVector(dimensions), errors.invalidInitParam());
        const param = new Parameter_1.Parameter(dimensions, handle);
        // if the parameter has a handle, set handle mapping
        if (handle) {
            utils_1.validate(!this.declarationMap.has(handle), errors.duplicateHandle(handle));
            this.declarationMap.set(handle, param);
        }
        // set index mapping and add parameter to the list
        this.declarationMap.set(`param::${this.params.length}`, param);
        this.params.push(param);
    }
    // EXPRESSION BUILDERS
    // --------------------------------------------------------------------------------------------
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
    staticOffsetInvalid: (t) => `cannot load static row ${t}: static row offset must be 0`,
    tooManyInitParams: () => `trace initializer procedure cannot have more than 1 parameter`,
    invalidInitParam: () => `trace initializer procedure parameter must be a vector`
};
//# sourceMappingURL=ProcedureContext.js.map