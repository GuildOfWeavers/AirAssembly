// IMPORTS
// ================================================================================================
import { compile, instantiate } from '../index';

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
const schema = compile(Buffer.from(source));
const air = instantiate(schema);

// generate trace table
const pObject = air.initProof();
const trace = pObject.generateExecutionTrace([3n]);

// generate constraint evaluation table
const pPolys = air.field.interpolateRoots(pObject.executionDomain, trace);
const cEvaluations = pObject.evaluateTransitionConstraints(pPolys);

console.log('done!');