// IMPORTS
// ================================================================================================
import { ProcedureName } from "@guildofweavers/air-assembly";
import { AirSchema } from "../../AirSchema";
import { ProcedureContext } from "./ProcedureContext";
import { TraceSegment } from "../../expressions";

// CLASS DEFINITION
// ================================================================================================
export class TransitionContext extends ProcedureContext {

    readonly span           : number;
    readonly width          : number;
    readonly traceRegisters : TraceSegment;
    readonly staticRegisters: TraceSegment;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema: AirSchema, span: number, width: number) {
        super(schema.field, schema.constants);

        this.span = span;
        this.width = width;
        this.traceRegisters = new TraceSegment('trace', width);
        this.staticRegisters = new TraceSegment('static', schema.staticRegisterCount);
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get name(): ProcedureName {
        return 'transition';
    }
}