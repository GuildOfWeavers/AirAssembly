"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Expression_1 = require("./Expression");
const utils_1 = require("./utils");
const utils_2 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class LiteralValue extends Expression_1.Expression {
    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(value, field) {
        if (typeof value === 'bigint') {
            // value is a scalar
            super(utils_1.Dimensions.scalar());
            utils_2.validate(field.isElement(value), errors.invalidFieldElement(value));
        }
        else if (Array.isArray(value)) {
            // value is a vector or a matrix
            const rowCount = value.length;
            if (isBigIntArray(value)) {
                // value is a vector
                super(utils_1.Dimensions.vector(rowCount));
                value.forEach(v => utils_2.validate(field.isElement(v), errors.invalidFieldElement(v)));
            }
            else {
                // value is a matrix
                const colCount = value[0].length;
                super(utils_1.Dimensions.matrix(rowCount, colCount));
                for (let row of value) {
                    utils_2.validate(row.length === colCount, errors.inconsistentMatrix());
                    row.forEach(v => utils_2.validate(field.isElement(v), errors.invalidFieldElement(v)));
                }
            }
        }
        else {
            throw new Error(`invalid literal value '${value}'`);
        }
        this.value = value;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get isStatic() {
        return true;
    }
    get elements() {
        if (this.isScalar)
            return [this.value];
        else if (this.isVector)
            return this.value;
        else {
            let elements = [];
            for (let row of this.value) {
                elements = elements.concat(row);
            }
            return elements;
        }
    }
    // PUBLIC METHODS
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
// HELPER FUNCTIONS
// ================================================================================================
function isBigIntArray(value) {
    return typeof value[0] === 'bigint';
}
// ERRORS
// ================================================================================================
const errors = {
    invalidFieldElement: (v) => `${v} is not a valid field element`,
    inconsistentMatrix: () => `all matrix rows must have the same number of columns`
};
//# sourceMappingURL=LiteralValue.js.map