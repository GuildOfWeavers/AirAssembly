// IMPORTS
// ================================================================================================
import { Expression, LiteralValue, LoadExpression } from "../expressions";
import { Constant } from "../procedures";

// PUBLIC FUNCTIONS
// ================================================================================================
export function getExponentValue(exp: Expression): bigint {
    if (!exp.isScalar) throw new Error(`cannot raise to non-scalar power`);

    if (exp instanceof LiteralValue) {
        return exp.value as bigint;
    }
    else if (exp instanceof LoadExpression && exp.binding instanceof Constant) {
        return exp.binding.value.value as bigint;   // TODO?
    }
    else {
        throw new Error(`cannot raise to non-constant power`);
    }
}