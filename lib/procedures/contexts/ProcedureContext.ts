// IMPORTS
// ================================================================================================
import { ProcedureName } from "@guildofweavers/air-assembly";
import { ExecutionContext } from "./ExecutionContext";
import { LoadExpression, TraceSegment } from "../../expressions";
import { LocalVariable } from "../LocalVariable";
import { validate } from "../../utils";
import { Component } from "../../Component";

// CLASS DEFINITION
// ================================================================================================
export class ProcedureContext extends ExecutionContext {

    readonly name              : ProcedureName;
    readonly traceRegisters    : TraceSegment;
    readonly staticRegisters   : TraceSegment;
    readonly width             : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(name: ProcedureName, component: Component) {
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
        this.traceRegisters = new TraceSegment('trace', component.traceRegisterCount);
        this.staticRegisters = new TraceSegment('static', component.staticRegisterCount);
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
            this.validateTraceAccess(indexOrHandle);
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

    // PRIVATE FUNCTION
    // --------------------------------------------------------------------------------------------
    private validateTraceAccess(offset: number): void {
        if (this.name === 'init') {
            throw new Error(`cannot load trace row: trace table cannot be accessed in init procedures`);
        }
        else if (this.name === 'transition') {
            validate(offset === 0, `cannot load trace row ${offset}: trace row offset cannot be greater than 0`);
        }
        else if (this.name === 'evaluation') {
            validate(offset <= 1, `cannot load trace row ${offset}: trace row offset cannot be greater than 1`);
        }
    }
}

// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle     : (h: any) => `handle ${h} cannot be declared multiple times`,
    traceHandleInvalid  : (t: any) => `cannot load trace row ${t}: trace row offset must be an integer`,
    staticHandleInvalid : (t: any) => `cannot load static row ${t}: static row offset must be an integer`,
    staticOffsetInvalid : (t: any) => `cannot load static row ${t}: static row offset must be 0`
};