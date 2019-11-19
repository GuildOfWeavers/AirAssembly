"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const Expression_1 = require("./Expression");
// CLASS DEFINITION
// ================================================================================================
class MakeVector extends Expression_1.Expression {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(elements) {
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
    get elements() { return this.children; }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    getElementFor(index) {
        let position = 0;
        for (let element of this.elements) {
            if (position >= index)
                return element;
            position += element.dimensions[0] || 1;
        }
    }
    toString(options = {}) {
        const list = this.elements.map(e => e.toString({ vectorAsList: true })).join(' ');
        return options.vectorAsList ? list : `(vector ${list})`;
    }
}
exports.MakeVector = MakeVector;
//# sourceMappingURL=MakeVector.js.map