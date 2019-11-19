// IMPORTS
// ================================================================================================
import { expressions } from '@guildofweavers/air-assembly';
import { Dimensions } from "./utils";

// INTERFACES
// ================================================================================================
export interface AssemblyOptions {
    vectorAsList?   : boolean;
}

export interface ExpressionTransformer {
    (e: Expression) : Expression;
}

// CLASS DEFINITION
// ================================================================================================
export abstract class Expression implements expressions.Expression {

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

    // ACCESSORS
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

    get isStatic(): boolean {
        return false;
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    transform(transformer: ExpressionTransformer): void {
        for (let i = 0; i < this.children.length; i++) {
            let oChild = this.children[i];
            let nChild = transformer(oChild);
    
            if (oChild !== nChild) {
                this.children[i] = nChild;
            }
            else {
                oChild.transform(transformer);
            }
        }
    }

    findPath(expression: Expression): number[] | undefined {
        for (let i = 0; i < this.children.length; i++) {
            let child = this.children[i];
            if (child === expression) {
                return [i];
            }
            else {
                let subPath = child.findPath(expression);
                if (subPath) {
                    return [i, ...subPath];
                }
            }
        }
    }
}