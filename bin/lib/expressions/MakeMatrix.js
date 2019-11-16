"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const Expression_1 = require("./Expression");
// CLASS DEFINITION
// ================================================================================================
class MakeMatrix extends Expression_1.Expression {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(elements) {
        const rowCount = elements.length;
        const colCount = elements[0].length;
        const children = [];
        for (let row of elements) {
            let rowLength = 0;
            for (let element of row) {
                if (!element.isScalar) {
                    throw new Error('matrix elements must be scalars');
                }
                children.push(element);
                rowLength++;
            }
            if (rowLength !== colCount) {
                throw new Error('all matrix rows must have the same number of columns');
            }
        }
        super([rowCount, colCount], children);
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get elements() {
        const rows = [];
        const [rowCount, colCount] = this.dimensions;
        for (let i = 0; i < rowCount; i++) {
            rows.push(this.children.slice(i * colCount, (i + 1) * colCount));
        }
        return rows;
    }
    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------   
    toString() {
        const rows = this.elements.map(r => `(${r.map(e => e.toString()).join(' ')})`);
        return `(matrix ${rows.join(' ')})`;
    }
}
exports.MakeMatrix = MakeMatrix;
//# sourceMappingURL=MakeMatrix.js.map