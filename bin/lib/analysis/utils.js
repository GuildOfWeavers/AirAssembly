"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const expressions_1 = require("../expressions");
// PUBLIC FUNCTIONS
// ================================================================================================
function getExponentValue(exp) {
    if (!exp.isScalar)
        throw new Error(`cannot raise to non-scalar power`);
    if (exp instanceof expressions_1.LiteralValue) {
        return exp.value;
    }
    else if (exp instanceof expressions_1.LoadExpression && exp.binding instanceof expressions_1.LiteralValue) {
        return exp.binding.value;
    }
    else {
        throw new Error(`cannot raise to non-constant power`);
    }
}
exports.getExponentValue = getExponentValue;
//# sourceMappingURL=utils.js.map