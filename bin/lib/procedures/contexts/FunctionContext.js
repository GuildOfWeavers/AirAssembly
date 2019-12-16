"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExecutionContext_1 = require("./ExecutionContext");
const utils_1 = require("../../utils");
// CLASS DEFINITION
// ================================================================================================
class FunctionContext extends ExecutionContext_1.ExecutionContext {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema, result, handle) {
        super(schema.field, schema.constants, schema.functions);
        this.result = result;
        if (handle !== undefined) {
            this.handle = utils_1.validateHandle(handle);
        }
    }
}
exports.FunctionContext = FunctionContext;
//# sourceMappingURL=FunctionContext.js.map