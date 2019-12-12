// IMPORTS
// ================================================================================================
import { AirSchema } from "../../AirSchema";
import { ProcedureName } from "@guildofweavers/air-assembly";
import { ExecutionContext } from "./ExecutionContext";
import { LoadExpression, TraceSegment } from "../../expressions";
import { LocalVariable } from "../LocalVariable";
import { validate } from "../../utils";

// CLASS DEFINITION
// ================================================================================================
export class ProcedureContext extends ExecutionContext {

    readonly name              : ProcedureName;
    readonly traceRegisters    : TraceSegment;
    readonly staticRegisters   : TraceSegment;
    readonly span              : number;
    readonly width             : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(name: ProcedureName, schema: AirSchema, span: number, width: number) {
        super(schema);
        this.name = name;
        if (name === 'transition') {
            this.span = span;
            this.width = width;
            this.traceRegisters = new TraceSegment('trace', width);
            this.staticRegisters = new TraceSegment('static', schema.staticRegisterCount);
        }
        else if (name === 'evaluation') {
            this.span = span;
            this.width = width;
            this.traceRegisters = new TraceSegment('trace', schema.traceRegisterCount);
            this.staticRegisters = new TraceSegment('static', schema.staticRegisterCount);
        }
        else {
            throw new Error(`procedure name '${name}' is not valid`);
        }
    }

    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
    add(value: LocalVariable): void {
        if (value instanceof LocalVariable) {
            // if local variable has a handle, set handle mapping
            if (value.handle) {
                validate(!this.declarationMap.has(value.handle), errors.duplicateHandle(value.handle));
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

    buildLoadExpression(operation: string, indexOrHandle: number | string): LoadExpression {
        if (operation === 'load.trace') {
            validate(typeof indexOrHandle === 'number', errors.traceHandleInvalid(indexOrHandle));
            validate(indexOrHandle < this.span, errors.traceOffsetInvalid(indexOrHandle, this.span));
            return new LoadExpression(this.traceRegisters, indexOrHandle);
        }
        else if (operation === 'load.static') {
            validate(typeof indexOrHandle === 'number', errors.staticHandleInvalid(indexOrHandle));
            validate(indexOrHandle === 0, errors.staticOffsetInvalid(indexOrHandle));
            return new LoadExpression(this.staticRegisters, indexOrHandle);
        }
        else {
            return super.buildLoadExpression(operation, indexOrHandle);
        }
    }
}

// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle     : (h: any) => `handle ${h} cannot be declared multiple times`,
    traceHandleInvalid  : (t: any) => `cannot load trace row ${t}: trace row offset must be an integer`,
    traceOffsetInvalid  : (t: any, s: any) => `cannot load trace row ${t}: trace row offset must be smaller than ${s}`,
    staticHandleInvalid : (t: any) => `cannot load static row ${t}: static row offset must be an integer`,
    staticOffsetInvalid : (t: any) => `cannot load static row ${t}: static row offset must be 0`
};