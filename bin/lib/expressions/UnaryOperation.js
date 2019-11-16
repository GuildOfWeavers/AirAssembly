"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Expression_1 = require("./Expression");
// CLASS DEFINITION
// ================================================================================================
class UnaryOperation extends Expression_1.Expression {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(operation, operand) {
        if (operation === 'neg' || operation === 'inv') {
            super(operand.dimensions, [operand]);
        }
        else {
            throw new Error(`unary operation '${operation}' is not valid`);
        }
        this.operation = operation;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get operand() { return this.children[0]; }
    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(${this.operation} ${this.operand.toString()})`;
    }
}
exports.UnaryOperation = UnaryOperation;
//# sourceMappingURL=UnaryOperation.js.map