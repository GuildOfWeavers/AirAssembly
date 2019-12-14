// IMPORTS
// ================================================================================================
import { AirFunction } from "../procedures";
import { Expression } from "./Expression";
import { Dimensions } from "./utils";
import { validate } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class CallExpression extends Expression {

    readonly func   : AirFunction;
    readonly index  : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(func: AirFunction, index: number, parameters: Expression[]) {
        validate(func.parameters.length === parameters.length,
            errors.invalidParamCount(index, func.parameters.length, parameters.length));
        
        func.parameters.forEach((param, i) =>
            validate(Dimensions.areSameDimensions(param.dimensions, parameters[i].dimensions), 
                errors.invalidParamType(index, i, param.dimensions)));

        super(func.dimensions, parameters);
        this.func = func;
        this.index = index;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get parameters(): Expression[] {
        return this.children;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        const indexOrHandle = (this.func.handle) ? this.func.handle : this.index.toString();
        return `(call ${indexOrHandle} ${this.parameters.map(p => p.toString()).join(' ')})`;
    }
}

// ERRORS
// ================================================================================================
const errors = {
    invalidParamCount   : (f: any, e: any, a: any) => `invalid function call: function ${f} expects ${e} parameters but received ${a} parameters`,
    invalidParamType    : (f: any, i: any, d: any) => `invalid function call: function ${f} expects ${Dimensions.toString(d)} value for parameter ${i}`
};