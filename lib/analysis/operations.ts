// IMPORTS
// ================================================================================================
import { Expression, BinaryOperation, UnaryOperation } from "../expressions";
import { getExponentValue } from "./utils";

// INTERFACES
// ================================================================================================
export interface OperationStats {
    add : number;
    mul : number;
    inv : number;
}

// PUBLIC FUNCTIONS
// ================================================================================================
export function analyzeBinaryOperation(e: BinaryOperation, stats: OperationStats): void {
    switch(e.operation) {
        case 'add': case 'sub': {
            stats.add += getSimpleOperationCount(e.lhs);
            break;
        }
        case 'mul': {
            stats.mul += getSimpleOperationCount(e.lhs);
            break;
        }
        case 'div': {
            stats.mul += getSimpleOperationCount(e.lhs);
            stats.inv += 1;
            break;
        }
        case 'exp': {
            const opCount = getSimpleOperationCount(e.lhs);
            let exponent = getExponentValue(e.rhs);
            let mulCount = 0;
            while (exponent) {
                exponent = exponent >> 1n;
                mulCount++;
            }
            stats.mul += opCount * mulCount;
            break;
        }
        case 'prod': {
            if (e.lhs.isVector) {
                stats.mul += e.lhs.dimensions[0];
                stats.add += e.lhs.dimensions[0] - 1;
            }
            else if (e.lhs.isMatrix && e.rhs.isVector) {
                stats.mul += e.lhs.dimensions[0] * e.lhs.dimensions[1];
                stats.add += e.rhs.dimensions[0] * (e.lhs.dimensions[1] - 1);
            }
            else {
                stats.mul += e.lhs.dimensions[0] * e.lhs.dimensions[1] * e.rhs.dimensions[1];
                stats.add += e.rhs.dimensions[0] * (e.lhs.dimensions[1] - 1) * e.rhs.dimensions[1];
            }
            break;
        }
    }
}

export function analyzeUnaryOperation(e: UnaryOperation, stats: OperationStats): void {
    switch (e.operation) {
        case 'neg': {
            stats.add += getSimpleOperationCount(e.operand);
            break;
        }
        case 'inv': {
            stats.inv += getSimpleOperationCount(e.operand);
            break;
        }
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function getSimpleOperationCount(e: Expression): number {
    if (e.isScalar) return 1;
    else if (e.isVector) return e.dimensions[0];
    else return e.dimensions[0] * e.dimensions[1];
}