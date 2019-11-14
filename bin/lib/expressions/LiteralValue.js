"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const Expression_1 = require("./Expression");
const utils_1 = require("./utils");
// CLASS DEFINITION
// ================================================================================================
class LiteralValue extends Expression_1.Expression {
    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(value) {
        if (typeof value === 'bigint') {
            // value is a scalar
            super(utils_1.Dimensions.scalar(), 0n);
        }
        else if (Array.isArray(value)) {
            // value is a vector or a matrix
            const rowCount = value.length;
            if (typeof value[0] === 'bigint') {
                // value is a vector
                super(utils_1.Dimensions.vector(rowCount), new Array(rowCount).fill(0n));
            }
            else {
                // value is a matrix
                const colCount = value[0].length;
                const colDegrees = new Array(colCount).fill(0n);
                super(utils_1.Dimensions.matrix(rowCount, colCount), new Array(rowCount).fill(colDegrees));
                for (let row of value) {
                    if (row.length !== colCount) {
                        throw new Error(`all matrix rows must have the same number of columns`);
                    }
                }
            }
        }
        else {
            throw new Error(`invalid constant value '${value}'`);
        }
        this.value = value;
    }
    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    toString() {
        if (this.isScalar) {
            return `(scalar ${this.value})`;
        }
        else if (this.isVector) {
            return `(vector ${this.value.join(' ')})`;
        }
        else {
            const rows = this.value.map(r => `(${r.join(' ')})`);
            return `(matrix ${rows.join(' ')})`;
        }
    }
}
exports.LiteralValue = LiteralValue;
//# sourceMappingURL=LiteralValue.js.map