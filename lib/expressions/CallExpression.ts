// IMPORTS
// ================================================================================================
import { AirFunction } from "../procedures";
import { Expression } from "./Expression";
import { Dimensions } from "./utils";

// CLASS DEFINITION
// ================================================================================================
export class CallExpression extends Expression {

    readonly func   : AirFunction;
    readonly index  : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(func: AirFunction, index: number, parameters: Expression[]) {
        if (func.parameters.length !== parameters.length) {
            throw new Error('TODO');
        }

        func.parameters.forEach((param, i) => {
            if (!Dimensions.areSameDimensions(param.dimensions, parameters[i].dimensions)) {
                throw new Error('TODO');
            }
        });

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