"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const expressions_1 = require("../expressions");
const procedures_1 = require("../procedures");
// PUBLIC FUNCTIONS
// ================================================================================================
function getExponentValue(exp) {
    if (!exp.isScalar)
        throw new Error(`cannot raise to non-scalar power`);
    if (exp instanceof expressions_1.LiteralValue) {
        return exp.value;
    }
    else if (exp instanceof expressions_1.LoadExpression && exp.binding instanceof procedures_1.Constant) {
        return exp.binding.value.value; // TODO?
    }
    else {
        throw new Error(`cannot raise to non-constant power`);
    }
}
exports.getExponentValue = getExponentValue;
//# sourceMappingURL=utils.js.map