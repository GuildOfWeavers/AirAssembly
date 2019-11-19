// IMPORTS
// ================================================================================================
import { Expression, AssemblyOptions } from "./Expression";

// CLASS DEFINITION
// ================================================================================================
export class MakeVector extends Expression {

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(elements: Expression[]) {
        
        let length = 0;
        for (let element of elements) {
            if (element.isScalar) {
                length += 1;
            }
            else if (element.isVector) {
                length += element.dimensions[0];
            }
            else {
                throw new Error('cannot build vector from matrix elements');
            }
        }
        super([length, 0], elements);
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get elements(): Expression[] { return this.children; }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getElementFor(index: number): Expression | undefined {
        let position = 0;
        for (let element of this.elements) {
            if (position >= index) return element;
            position += element.dimensions[0] || 1;
        }
    }

    toString(options: AssemblyOptions = {}): string {
        const list = this.elements.map(e => e.toString({ vectorAsList: true })).join(' ');
        return options.vectorAsList ? list : `(vector ${list})`;
    }
}