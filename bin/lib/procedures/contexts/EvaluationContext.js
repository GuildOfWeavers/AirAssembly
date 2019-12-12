"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProcedureContext_1 = require("./ProcedureContext");
const expressions_1 = require("../../expressions");
// CLASS DEFINITION
// ================================================================================================
class EvaluationContext extends ProcedureContext_1.ProcedureContext {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema, span, width) {
        super(schema.field, schema.constants);
        this.span = span;
        this.width = width;
        this.traceRegisters = new expressions_1.TraceSegment('trace', schema.traceRegisterCount);
        this.staticRegisters = new expressions_1.TraceSegment('static', schema.staticRegisterCount);
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get name() {
        return 'evaluation';
    }
}
exports.EvaluationContext = EvaluationContext;
//# sourceMappingURL=EvaluationContext.js.map