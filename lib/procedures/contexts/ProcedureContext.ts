// IMPORTS
// ================================================================================================
import { ProcedureName, ProcedureContext as IProcedureContext } from "@guildofweavers/air-assembly";
import { ExecutionContext } from "./ExecutionContext";
import { LoadExpression, TraceSegment, Dimensions } from "../../expressions";
import { Parameter } from "../Parameter";
import { Component } from "../../Component";
import { validate } from "../../utils";

// CLASS DEFINITION
// ================================================================================================
export class ProcedureContext extends ExecutionContext implements IProcedureContext {

    readonly name               : ProcedureName;
    readonly traceRegisters     : TraceSegment;
    readonly staticRegisters    : TraceSegment;
    readonly width              : number;

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
    addParam(dimensions: Dimensions, handle?: string): void {
        validate(this.params.length === 0, errors.tooManyInitParams());
        validate(Dimensions.isVector(dimensions), errors.invalidInitParam());
        const param = new Parameter(dimensions, handle);

        // if the parameter has a handle, set handle mapping
        if (handle) {
            validate(!this.declarationMap.has(handle), errors.duplicateHandle(handle));
            this.declarationMap.set(handle, param);
        }

        // set index mapping and add parameter to the list
        this.declarationMap.set(`param::${this.params.length}`, param);
        this.params.push(param);
    }

    // EXPRESSION BUILDERS
    // --------------------------------------------------------------------------------------------
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
    staticOffsetInvalid : (t: any) => `cannot load static row ${t}: static row offset must be 0`,
    tooManyInitParams   : () => `trace initializer procedure cannot have more than 1 parameter`,
    invalidInitParam    : () => `trace initializer procedure parameter must be a vector`
};