"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const index_1 = require("../../index");
const utils_1 = require("../../lib/utils");
// EXAMPLE CODE
// ================================================================================================
const schema = index_1.compile('./examples/ec/pointmul.aa');
const air = index_1.instantiate(schema);
console.log(`degree: ${air.maxConstraintDegree}`);
const gStart = Date.now();
let start = Date.now();
const pContext = air.initProvingContext([
    [19277929113566293071110308034699488026831934219452440156649784352033n],
    [19926808758034470970197974370888749184205991990603949537637343198772n],
    [toBits(21628546220445634706341881427918508772248629391536891476641575405363n)]
]);
console.log(`Initialized proof object in ${Date.now() - start} ms`);
start = Date.now();
const trace = pContext.generateExecutionTrace();
console.log(`Execution trace generated in ${Date.now() - start} ms`);
utils_1.printMatrix(trace, 'step', 'r');
start = Date.now();
const pPolys = air.field.interpolateRoots(pContext.executionDomain, trace);
console.log(`Trace polynomials computed in ${Date.now() - start} ms`);
start = Date.now();
const pEvaluations = air.field.evalPolysAtRoots(pPolys, pContext.evaluationDomain);
console.log(`Extended execution trace in ${Date.now() - start} ms`);
start = Date.now();
const cEvaluations = pContext.evaluateTransitionConstraints(pPolys);
console.log(`Constraints evaluated in ${Date.now() - start} ms`);
//printMatrix(cEvaluations, 'step', 'd');
// HELPER FUNCTIONS
// ================================================================================================
function toBits(value) {
    const bits = value.toString(2).padStart(256, '0').split('');
    return bits.reverse().map(b => BigInt(b));
}
//# sourceMappingURL=index.js.map