"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const analyzer_1 = require("./analyzer");
// RE-EXPORTS
// ================================================================================================
var analyzer_2 = require("./analyzer");
exports.analyzeProcedure = analyzer_2.analyzeProcedure;
// PUBLIC FUNCTIONS
// ================================================================================================
function getConstraintDegrees(schema) {
    const result = analyzer_1.analyzeProcedure(schema.constraintEvaluator);
    const degrees = result.degree;
    return degrees.map(d => d > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Number(d));
}
exports.getConstraintDegrees = getConstraintDegrees;
//# sourceMappingURL=index.js.map