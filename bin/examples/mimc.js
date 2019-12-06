"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const index_1 = require("../index");
// SOURCE CODE
// ================================================================================================
const source = `
(module
    (field prime 4194304001)
    (const 
        (scalar 3))
    (static
        (cycle (prng sha256 0x4d694d43 32)))
    (transition
        (span 1) (result vector 1)
        (add 
            (exp (load.trace 0) (load.const 0))
            (get (load.static 0) 0)))
    (evaluation
        (span 2) (result vector 1)
        (sub
            (load.trace 1)
            (add
                (exp (load.trace 0) (load.const 0))
                (get (load.static 0) 0))))
    (export main (init seed) (steps 32)))
`;
// EXAMPLE CODE
// ================================================================================================
// instantiate AirModule object
const schema = index_1.compile(Buffer.from(source));
const air = index_1.instantiate(schema, { extensionFactor: 16 });
// generate trace table
const prover = air.initProof();
const trace = prover.generateExecutionTrace([3n]);
// generate constraint evaluation table
const pPolys = air.field.interpolateRoots(prover.executionDomain, trace);
const cEvaluations = prover.evaluateTransitionConstraints(pPolys);
const verifier = air.initVerification(prover.inputShapes);
const x = air.field.exp(verifier.rootOfUnity, 16n);
const rValues = [trace.getValue(0, 1)];
const nValues = [trace.getValue(0, 2)];
const qValues = verifier.evaluateConstraintsAt(x, rValues, nValues, []);
console.log(qValues);
console.log('done!');
//# sourceMappingURL=mimc.js.map