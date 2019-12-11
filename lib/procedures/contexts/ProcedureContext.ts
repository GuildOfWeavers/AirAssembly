// IMPORTS
// ================================================================================================
import { AirSchema } from "../../AirSchema";
import { ExecutionContext } from "./ExecutionContext";
import { LoadExpression, TraceSegment } from "../../expressions";
import { LocalVariable } from "../LocalVariable";
import { Constant } from "../Constant";
import { validate } from "../../utils";

// CLASS DEFINITION
// ================================================================================================
export class ProcedureContext extends ExecutionContext {

    readonly constants          : Constant[];
    readonly locals             : LocalVariable[];
    readonly traceRegisters     : TraceSegment;
    readonly staticRegisters    : TraceSegment;
    readonly traceSpan          : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema: AirSchema, traceSpan: number, traceWidth?: number) {
        super(schema.field);
        
        this.constants = []; // TODO
        for (let constant of this.constants) {
            if (constant.handle) {
                validate(!this.declarationMap.has(constant.handle), errors.duplicateHandle(constant.handle));
                this.declarationMap.set(constant.handle, constant);
            }
        }

        this.locals = [];
        this.traceSpan = traceSpan;
        this.traceRegisters = new TraceSegment('trace', traceWidth ? traceWidth : schema.traceRegisterCount);
        this.staticRegisters = new TraceSegment('static', schema.staticRegisterCount);
    }

    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
    add(value: LocalVariable): void {
        if (value instanceof Constant) {
            // if local variable has a handle, set handle mapping
            if (value.handle) {
                validate(!this.declarationMap.has(value.handle), errors.duplicateHandle(value.handle));
                this.declarationMap.set(value.handle, value);
            }

            // set index mapping and add local variable to the list
            this.declarationMap.set(`local::${this.constants.length}`, value);
            this.constants.push(value);
        }
        else {
            throw new Error(`${value} is not allowed in procedure context`);
        }
    }

    buildLoadExpression(operation: string, indexOrHandle: number | string): LoadExpression {
        if (operation === 'load.const') {
            const constant = this.declarationMap.get(`const::${indexOrHandle}`) as Constant;
            validate(constant !== undefined, errors.constNotDeclared(indexOrHandle));
            const index = this.constants.indexOf(constant);
            validate(index !== -1, errors.constHandleInvalid(indexOrHandle));
            return new LoadExpression(constant, index);
        }
        else if (operation === 'load.local') {
            const variable = this.declarationMap.get(`local::${indexOrHandle}`) as LocalVariable;
            validate(variable !== undefined, errors.localNotDeclared(indexOrHandle));
            const index = this.locals.indexOf(variable);
            validate(index !== -1, errors.localHandleInvalid(indexOrHandle));
            const binding = variable.getBinding(index);
            return new LoadExpression(binding, index);
        }
        else if (operation === 'load.trace') {
            validate(typeof indexOrHandle === 'number', errors.traceHandleInvalid(indexOrHandle));
            validate(indexOrHandle < this.traceSpan, errors.traceOffsetInvalid(indexOrHandle, this.traceSpan));
            return new LoadExpression(this.traceRegisters, indexOrHandle);
        }
        else if (operation === 'load.static') {
            validate(typeof indexOrHandle === 'number', errors.staticHandleInvalid(indexOrHandle));
            validate(indexOrHandle === 0, errors.staticOffsetInvalid(indexOrHandle));
            return new LoadExpression(this.staticRegisters, indexOrHandle);
        }
        else {
            throw new Error(`${operation} is not a valid load operation`);
        }
    }
}

// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle     : (h: any) => `handle ${h} cannot be declared multiple times`,
    constNotDeclared    : (p: any) => `cannot load constant ${p}: constant ${p} has not been declared`,
    constHandleInvalid  : (p: any) => `cannot load constant ${p}: handle does not identify a constant`,
    localNotDeclared    : (v: any) => `cannot load local variable ${v}: local variable ${v} has not been declared`,
    localHandleInvalid  : (v: any) => `cannot load local variable ${v}: handle does not identify a local variable`,
    traceHandleInvalid  : (t: any) => `cannot load trace row ${t}: trace row offset must be an integer`,
    traceOffsetInvalid  : (t: any, s: any) => `cannot load trace row ${t}: trace row offset must be smaller than ${s}`,
    staticHandleInvalid : (t: any) => `cannot load static row ${t}: static row offset must be an integer`,
    staticOffsetInvalid : (t: any) => `cannot load static row ${t}: static row offset must be 0`
};