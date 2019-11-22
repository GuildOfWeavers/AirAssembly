// IMPORTS
// ================================================================================================
import { compile, instantiate, analyze } from '../index';

// SOURCE CODE
// ================================================================================================
const source = `
(module
    (field prime 4194304001)
    (const
        (matrix (1 2 3) (1 2 3) (1 2 3)))
    (static
        (input secret vector (steps 64) (shift -1))
        (input secret vector (steps 64) (shift -1))
        (mask inverted (input 0))
        (cycle 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1)
        (cycle 42 43 170 2209)
        (cycle 42 43 170 2209)
        (cycle 42 43 170 2209))
    (transition
        (span 1) (result vector 3)
        (local vector 3) (local vector 3)
        (store.local 0 
            (prod
                (load.const 0)
                (exp
                    (add (load.trace 0) (slice (load.static 0) 4 6))
                    (scalar 3))))
        (store.local 1
            (prod
                (load.const 0)
                (vector
                    (add (slice (load.trace 0) 0 1) (slice (load.static 0) 4 5))
                    (exp
                        (add (get (load.trace 0) 2) (get (load.static 0) 6))
                        (scalar 3)))))
        (add
            (vector (slice (load.static 0) 0 1) (scalar 0))
            (mul 
                (add
                    (mul (load.local 0) (get (load.static 0) 3))
                    (mul (load.local 1) (sub (scalar 1)  (get (load.static 0) 3))))
                (get (load.static 0) 2)))
    )
    (evaluation
        (span 2) (result vector 3)
		(local vector 3) (local vector 3)
        (store.local 0 
            (prod
                (load.const 0)
                (exp
                    (add (load.trace 0) (slice (load.static 0) 4 6))
                    (scalar 3))))
        (store.local 1
            (prod
                (load.const 0)
                (vector
                    (add (slice (load.trace 0) 0 1) (slice (load.static 0) 4 5))
                    (exp
                        (add (get (load.trace 0) 2) (get (load.static 0) 6))
                        (scalar 3)))))
        (sub
            (load.trace 1)
            (add
                (vector (slice (load.static 0) 0 1) (scalar 0))
                (mul 
                    (add
                        (mul (load.local 0) (get (load.static 0) 3))
                        (mul (load.local 1) (sub (scalar 1)  (get (load.static 0) 3))))
                    (get (load.static 0) 2)))
		)
	)
    (export main (init seed) (steps 64)))
`;

// EXAMPLE CODE
// ================================================================================================
const inputs = [
    [42n],
    [43n]
];

// instantiate AirModule object
const schema = compile(Buffer.from(source));
const stats = analyze(schema);
const air = instantiate(schema);

// generate trace table
const pObject = air.initProof(inputs);
const trace = pObject.generateExecutionTrace([inputs[0][0], inputs[0][1], 0n]);

// generate constraint evaluation table
const pPolys = air.field.interpolateRoots(pObject.executionDomain, trace);
const cEvaluations = pObject.evaluateTracePolynomials(pPolys);

console.log('done!');