// IMPORTS
// ================================================================================================
import { BinaryOperationType } from "@guildofweavers/air-assembly";
import { Expression, } from "./Expression";
import { Dimensions } from "./utils";

// CLASS DEFINITION
// ================================================================================================
export class BinaryOperation extends Expression {

    readonly operation  : BinaryOperationType;
    
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(operation: string, lhs: Expression, rhs: Expression) {

        let dimensions: Dimensions;
        if (operation === 'add' || operation === 'sub' || operation === 'mul' || operation === 'div') {
            checkDimensions(lhs, rhs, operation);
            dimensions = lhs.dimensions;
        }
        else if (operation === 'exp') {
            checkExponent(rhs);
            dimensions = lhs.dimensions;
        }
        else if (operation === 'prod') {
            dimensions = getProductDimensions(lhs, rhs);
        }
        else {
            throw new Error(`binary operation '${operation}' is not valid`);
        }

        super(dimensions, [lhs, rhs]);
        this.operation = operation;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get lhs(): Expression { return this.children[0]; }
    get rhs(): Expression { return this.children[1]; }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        return `(${this.operation} ${this.lhs.toString()} ${this.rhs.toString()})`;
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function checkDimensions(lhs: Expression, rhs: Expression, operation: BinaryOperationType): void {
    if (!rhs.isScalar && !Dimensions.areSameDimensions(lhs.dimensions, rhs.dimensions)) {
        const d1 = `${lhs.dimensions[0]}x${lhs.dimensions[1]}`;
        const d2 = `${rhs.dimensions[0]}x${rhs.dimensions[1]}`;

        if (operation === 'add')
            throw new Error(`cannot add {${d1}} value to {${d2}} value`);
        else if (operation === 'sub')
            throw new Error(`cannot subtract {${d2}} value from {${d1}} value`);
        else if (operation === 'mul')
            throw new Error(`cannot multiply {${d1}} value by {${d2}} value`);
        else if (operation === 'div')
            throw new Error(`cannot divide {${d1}} value by {${d2}} value`);
    }
}

function checkExponent(exp: Expression): void {
    if (!exp.isScalar) throw new Error(`cannot raise to non-scalar power`);
    if (!exp.isStatic) throw new Error(`cannot raise to non-constant power`);
}

function getProductDimensions(rhs: Expression, lhs: Expression): Dimensions {
    const d1 = lhs.dimensions;
    const d2 = rhs.dimensions;

    if (lhs.isVector && rhs.isVector) {
        if (d1[0] !== d2[0])
            throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
        return Dimensions.scalar();
    }
    else if (lhs.isMatrix && rhs.isVector) {
        if (d1[1] !== d2[0])
            throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
        return Dimensions.vector(lhs.dimensions[0]);
    }
    else if (lhs.isMatrix && rhs.isMatrix) {
        if (d1[1] !== d2[0])
            throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
        return Dimensions.matrix(lhs.dimensions[0], rhs.dimensions[1]);
    }
    else {
        throw new Error(`cannot compute a product of {${d1}} and {${d2}} values`);
    }
}