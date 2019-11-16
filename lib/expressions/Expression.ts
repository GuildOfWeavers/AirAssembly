// IMPORTS
// ================================================================================================
import { Expression as IExpression } from '@guildofweavers/air-assembly';
import { Dimensions } from "./utils";

// INTERFACES
// ================================================================================================
export interface AssemblyOptions {
    vectorAsList?   : boolean;
}

// CLASS DEFINITION
// ================================================================================================
export abstract class Expression implements IExpression {

    readonly dimensions : Dimensions;
    readonly children   : Expression[];

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(dimensions: Dimensions, children: Expression[] = []) {
        this.dimensions = dimensions;
        this.children = children;
    }

    // ABSTRACT METHODS
    // --------------------------------------------------------------------------------------------
    abstract toString(options?: AssemblyOptions): string;

    // DIMENSION METHODS AND ACCESSORS
    // --------------------------------------------------------------------------------------------
    get isScalar(): boolean {
        return Dimensions.isScalar(this.dimensions);
    }

    get isVector(): boolean {
        return Dimensions.isVector(this.dimensions);
    }

    get isMatrix(): boolean {
        return Dimensions.isMatrix(this.dimensions);
    }

    isSameDimensions(e: Expression) {
        return Dimensions.areSameDimensions(this.dimensions, e.dimensions);
    }
}