// IMPORTS
// ================================================================================================
import { AirSchema } from "../../AirSchema";
import { ExecutionContext } from "./ExecutionContext";
import { Parameter } from "../Parameter";
import { LocalVariable } from "../LocalVariable";
import { LoadExpression } from "../../expressions";
import { validate } from "../../utils";

// CLASS DEFINITION
// ================================================================================================
export class FunctionContext extends ExecutionContext {

    readonly width      : number;
    readonly parameters : Parameter[];

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema: AirSchema, width: number) {
        super(schema.field);
        this.width = width;
        this.parameters = [];
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    add(value: Parameter | LocalVariable): void {
        // if parameter has a handle, set handle mapping
        if (value.handle) {
            validate(!this.declarationMap.has(value.handle), errors.duplicateHandle(value.handle));
            this.declarationMap.set(value.handle, value);
        }

        if (value instanceof Parameter) {
            // set index mapping and add parameter to the list
            this.declarationMap.set(`param::${this.parameters.length}`, value);
            this.parameters.push(value);
        }
        else if (value instanceof LocalVariable) {
            // set index mapping and add local variable to the list
            this.declarationMap.set(`local::${this.locals.length}`, value);
            this.locals.push(value);
        }
        else {
            throw new Error(`${value} is not valid in function context`);
        }
    }

    buildLoadExpression(operation: string, indexOrHandle: number | string): LoadExpression {
        if (operation === 'load.param') {
            const parameter = this.getDeclaration(indexOrHandle, 'param');
            validate(parameter !== undefined, errors.paramNotDeclared(indexOrHandle));
            const index = this.parameters.indexOf(parameter);
            validate(index !== -1, errors.paramHandleInvalid(indexOrHandle));
            return new LoadExpression(parameter, index);
        }
        else if (operation === 'load.local') {
            const variable = this.getDeclaration(indexOrHandle, 'local');
            validate(variable !== undefined, errors.localNotDeclared(indexOrHandle));
            const index = this.locals.indexOf(variable);
            validate(index !== -1, errors.localHandleInvalid(indexOrHandle));
            const binding = variable.getBinding(index);
            return new LoadExpression(binding, index);
        }
        else {
            throw new Error(`${operation} operation is not valid in function context`);
        }
    }
}

// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle     : (h: any) => `handle ${h} cannot be declared multiple times`,
    paramNotDeclared    : (p: any) => `cannot load parameter ${p}: parameter ${p} has not been declared`,
    paramHandleInvalid  : (p: any) => `cannot load parameter ${p}: handle does not identify a parameter`,
    localNotDeclared    : (v: any) => `cannot load local variable ${v}: local variable ${v} has not been declared`,
    localHandleInvalid  : (v: any) => `cannot load local variable ${v}: handle does not identify a local variable`
};