// IMPORTS
// ================================================================================================
import { Dimensions } from "../expressions/utils";
import { Subroutine } from "./Subroutine";

// CLASS DEFINITION
// ================================================================================================
export class LocalVariable {

    readonly dimensions : Dimensions;
    private binding?    : Subroutine;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(dimensions: Dimensions) {
        this.dimensions = dimensions;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get isBound(): boolean {
        return this.binding !== undefined;
    }

    getBinding(index: number): Subroutine {
        if (!this.binding) throw new Error(`local variable ${index} has not yet been set`);
        return this.binding;
    }

    bind(value: Subroutine, index: number) {
        if (!Dimensions.areSameDimensions(this.dimensions, value.expression.dimensions)) {
            const vd = value.expression.dimensions;
            throw new Error(`cannot store ${vd[0]}x${vd[1]} value in local variable ${index}`);
        }
        this.binding = value;
    }

    clearBinding() {
        this.binding = undefined;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        if (Dimensions.isScalar(this.dimensions)) return `(local scalar)`;
        else if (Dimensions.isVector(this.dimensions)) return `(local vector ${this.dimensions[0]})`;
        else return `(local matrix ${this.dimensions[0]} ${this.dimensions[1]})`;
    }
}