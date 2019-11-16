"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
// PUBLIC FUNCTIONS
// ================================================================================================
function analyzeBinaryOperation(e, stats) {
    switch (e.operation) {
        case 'add':
        case 'sub': {
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
            let exponent = utils_1.getExponentValue(e.rhs);
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
exports.analyzeBinaryOperation = analyzeBinaryOperation;
function analyzeUnaryOperation(e, stats) {
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
exports.analyzeUnaryOperation = analyzeUnaryOperation;
// HELPER FUNCTIONS
// ================================================================================================
function getSimpleOperationCount(e) {
    if (e.isScalar)
        return 1;
    else if (e.isVector)
        return e.dimensions[0];
    else
        return e.dimensions[0] * e.dimensions[1];
}
//# sourceMappingURL=operations.js.map