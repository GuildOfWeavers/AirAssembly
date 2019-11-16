// IMPORTS
// ================================================================================================
import { Expression, LiteralValue, LoadExpression } from "../expressions";

// PUBLIC FUNCTIONS
// ================================================================================================
export function getExponentValue(exp: Expression): bigint {
    if (!exp.isScalar) throw new Error(`cannot raise to non-scalar power`);

    if (exp instanceof LiteralValue) {
        return exp.value as bigint;
    }
    else if (exp instanceof LoadExpression && exp.binding instanceof LiteralValue) {
        return exp.binding.value as bigint;
    }
    else {
        throw new Error(`cannot raise to non-constant power`);
    }
}