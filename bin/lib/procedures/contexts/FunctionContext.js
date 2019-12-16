"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExecutionContext_1 = require("./ExecutionContext");
const Parameter_1 = require("../Parameter");
const LocalVariable_1 = require("../LocalVariable");
const utils_1 = require("../../utils");
// CLASS DEFINITION
// ================================================================================================
class FunctionContext extends ExecutionContext_1.ExecutionContext {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema, result) {
        super(schema.field, schema.constants, schema.functions);
        this.result = result;
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
            this.declarationMap.set(`param::${this.params.length}`, value);
            this.params.push(value);
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
}
exports.FunctionContext = FunctionContext;
// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle: (h) => `handle ${h} cannot be declared multiple times`
};
//# sourceMappingURL=FunctionContext.js.map