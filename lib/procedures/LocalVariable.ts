// IMPORTS
// ================================================================================================
import { Dimensions } from "../expressions/utils";
import { StoreOperation } from "./StoreOperation";
import { validateHandle } from "../utils";

// CLASS DEFINITION
// ================================================================================================
export class LocalVariable {

    readonly dimensions : Dimensions;
    readonly handle?    : string;
    private binding?    : StoreOperation;

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

    getBinding(index: number): StoreOperation {
        if (!this.binding) throw new Error(`local variable ${index} has not yet been set`);
        return this.binding;
    }

    bind(value: StoreOperation, index: number) {
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
        return `(local${handle}${Dimensions.toTypeString(this.dimensions)})`;
    }
}