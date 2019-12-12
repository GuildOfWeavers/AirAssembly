"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProcedureContext_1 = require("./ProcedureContext");
const expressions_1 = require("../../expressions");
// CLASS DEFINITION
// ================================================================================================
class TransitionContext extends ProcedureContext_1.ProcedureContext {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema, span, width) {
        super(schema.field, schema.constants);
        this.span = span;
        this.width = width;
        this.traceRegisters = new expressions_1.TraceSegment('trace', width);
        this.staticRegisters = new expressions_1.TraceSegment('static', schema.staticRegisterCount);
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get name() {
        return 'transition';
    }
}
exports.TransitionContext = TransitionContext;
//# sourceMappingURL=TransitionContext.js.map