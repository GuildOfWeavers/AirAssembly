// IMPORTS
// ================================================================================================
import { UnaryOperationType } from "@guildofweavers/air-assembly";
import { Expression } from "./Expression";

// CLASS DEFINITION
// ================================================================================================
export class UnaryOperation extends Expression {

    readonly operation  : UnaryOperationType;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(operation: string, operand: Expression) {
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
    get operand(): Expression { return this.children[0]; }

    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return `(${this.operation} ${this.operand.toString()})`;
    }
}