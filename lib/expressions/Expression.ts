// IMPORTS
// ================================================================================================
import { ExpressionDegree, LoadSource } from "@guildofweavers/air-assembly";
import { Dimensions } from "./utils";

// INTERFACES
// ================================================================================================
export interface AssemblyOptions {
    vectorAsList?: boolean;
}

// CLASS DEFINITION
// ================================================================================================
export abstract class Expression {

    readonly dimensions : Dimensions;
    readonly degree     : ExpressionDegree;
    readonly children   : Expression[]

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(dimensions: Dimensions, degree: ExpressionDegree, children: Expression[] = []) {
        this.dimensions = dimensions;
        this.degree = degree
        this.children = children;
    }

    // ABSTRACT METHODS
    // --------------------------------------------------------------------------------------------
    abstract toString(options?: AssemblyOptions): string;

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    compress(): void {
        this.children.forEach(child => child.compress());
    }

    collectLoadOperations(source: LoadSource, result: Map<Expression, Expression[]>): void {
        this.children.forEach(child => child.collectLoadOperations(source, result));
    }

    replace(oldExpression: Expression, newExpression: Expression): void {
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i] === oldExpression) {
                this.children[i] = newExpression;
            }
            else {
                this.children[i].replace(oldExpression, newExpression);
            }
        }
    }

    updateAccessorIndex(source: LoadSource, fromIdx: number, toIdx: number): void {
        this.children.forEach(child => child.updateAccessorIndex(source, fromIdx, toIdx));
    }

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