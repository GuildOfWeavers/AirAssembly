"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExecutionContext_1 = require("./ExecutionContext");
const Parameter_1 = require("../Parameter");
const LocalVariable_1 = require("../LocalVariable");
const expressions_1 = require("../../expressions");
const utils_1 = require("../../utils");
// CLASS DEFINITION
// ================================================================================================
class FunctionContext extends ExecutionContext_1.ExecutionContext {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema, width) {
        super(schema.field);
        this.width = width;
        this.parameters = [];
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    add(value) {
        // if parameter has a handle, set handle mapping
        if (value.handle) {
            utils_1.validate(!this.declarationMap.has(value.handle), errors.duplicateHandle(value.handle));
            this.declarationMap.set(value.handle, value);
        }
        if (value instanceof Parameter_1.Parameter) {
            // set index mapping and add parameter to the list
            this.declarationMap.set(`param::${this.parameters.length}`, value);
            this.parameters.push(value);
        }
        else if (value instanceof LocalVariable_1.LocalVariable) {
            // set index mapping and add local variable to the list
            this.declarationMap.set(`local::${this.locals.length}`, value);
            this.locals.push(value);
        }
        else {
            throw new Error(`${value} is not valid in function context`);
        }
    }
    buildLoadExpression(operation, indexOrHandle) {
        if (operation === 'load.param') {
            const parameter = this.getDeclaration(indexOrHandle, 'param');
            utils_1.validate(parameter !== undefined, errors.paramNotDeclared(indexOrHandle));
            const index = this.parameters.indexOf(parameter);
            utils_1.validate(index !== -1, errors.paramHandleInvalid(indexOrHandle));
            return new expressions_1.LoadExpression(parameter, index);
        }
        else if (operation === 'load.local') {
            const variable = this.getDeclaration(indexOrHandle, 'local');
            utils_1.validate(variable !== undefined, errors.localNotDeclared(indexOrHandle));
            const index = this.locals.indexOf(variable);
            utils_1.validate(index !== -1, errors.localHandleInvalid(indexOrHandle));
            const binding = variable.getBinding(index);
            return new expressions_1.LoadExpression(binding, index);
        }
        else {
            throw new Error(`${operation} operation is not valid in function context`);
        }
    }
}
exports.FunctionContext = FunctionContext;
// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle: (h) => `handle ${h} cannot be declared multiple times`,
    paramNotDeclared: (p) => `cannot load parameter ${p}: parameter ${p} has not been declared`,
    paramHandleInvalid: (p) => `cannot load parameter ${p}: handle does not identify a parameter`,
    localNotDeclared: (v) => `cannot load local variable ${v}: local variable ${v} has not been declared`,
    localHandleInvalid: (v) => `cannot load local variable ${v}: handle does not identify a local variable`
};
//# sourceMappingURL=FunctionContext.js.map