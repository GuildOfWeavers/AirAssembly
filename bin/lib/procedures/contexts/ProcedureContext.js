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
    constructor(field, constants) {
        super(field);
        this.constants = constants.map((constant, i) => {
            if (constant.handle) {
                utils_1.validate(!this.declarationMap.has(constant.handle), errors.duplicateHandle(constant.handle));
                this.declarationMap.set(constant.handle, constant);
            }
            this.declarationMap.set(`const::${i}`, constant);
            return constant;
        });
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
        if (operation === 'load.const') {
            const constant = this.getDeclaration(indexOrHandle, 'const');
            utils_1.validate(constant !== undefined, errors.constNotDeclared(indexOrHandle));
            const index = this.constants.indexOf(constant);
            utils_1.validate(index !== -1, errors.constHandleInvalid(indexOrHandle));
            return new expressions_1.LoadExpression(constant, index);
        }
        else if (operation === 'load.local') {
            const variable = this.getDeclaration(indexOrHandle, 'local');
            utils_1.validate(variable !== undefined, errors.localNotDeclared(indexOrHandle));
            const index = this.locals.indexOf(variable);
            utils_1.validate(index !== -1, errors.localHandleInvalid(indexOrHandle));
            const binding = variable.getBinding(index);
            return new expressions_1.LoadExpression(binding, index);
        }
        else if (operation === 'load.trace') {
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
            throw new Error(`${operation} is not a valid load operation`);
        }
    }
}
exports.ProcedureContext = ProcedureContext;
// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle: (h) => `handle ${h} cannot be declared multiple times`,
    constNotDeclared: (p) => `cannot load constant ${p}: constant ${p} has not been declared`,
    constHandleInvalid: (p) => `cannot load constant ${p}: handle does not identify a constant`,
    localNotDeclared: (v) => `cannot load local variable ${v}: local variable ${v} has not been declared`,
    localHandleInvalid: (v) => `cannot load local variable ${v}: handle does not identify a local variable`,
    traceHandleInvalid: (t) => `cannot load trace row ${t}: trace row offset must be an integer`,
    traceOffsetInvalid: (t, s) => `cannot load trace row ${t}: trace row offset must be smaller than ${s}`,
    staticHandleInvalid: (t) => `cannot load static row ${t}: static row offset must be an integer`,
    staticOffsetInvalid: (t) => `cannot load static row ${t}: static row offset must be 0`
};
//# sourceMappingURL=ProcedureContext.js.map