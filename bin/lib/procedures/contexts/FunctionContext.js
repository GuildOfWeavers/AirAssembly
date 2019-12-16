"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExecutionContext_1 = require("./ExecutionContext");
// CLASS DEFINITION
// ================================================================================================
class FunctionContext extends ExecutionContext_1.ExecutionContext {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema, result) {
        super(schema.field, schema.constants, schema.functions);
        this.result = result;
    }
}
exports.FunctionContext = FunctionContext;
//# sourceMappingURL=FunctionContext.js.map