// IMPORTS
// ================================================================================================
import { Dimensions } from "../expressions/utils";
import { Subroutine } from "./Subroutine";
import { validateHandle } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class LocalVariable {

    readonly dimensions : Dimensions;
    readonly handle?    : string;
    private binding?    : Subroutine;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(dimensions: Dimensions, handle?: string) {
        this.dimensions = dimensions;
        if (handle !== undefined) {
            this.handle = validateHandle(handle);
        }
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
        const handle = this.handle ? ` ${this.handle} ` : ' ';

        if (Dimensions.isScalar(this.dimensions))
            return `(local${handle}scalar)`;
        else if (Dimensions.isVector(this.dimensions))
            return `(local${handle}vector ${this.dimensions[0]})`;
        else
            return `(local${handle}matrix ${this.dimensions[0]} ${this.dimensions[1]})`;
    }
}