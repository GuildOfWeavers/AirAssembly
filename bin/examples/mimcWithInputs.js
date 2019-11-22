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
        (input secret vector (steps 16) (shift -1))
        (mask inverted (input 0))
        (cycle 42 43 170 2209))
    (transition
        (span 1) (result vector 1)
        (local vector 1)
        (store.local 0 
			(add 
				(exp (load.trace 0) (load.const 0))
                (get (load.static 0) 2)))
        (add
            (mul (load.local 0)	(get (load.static 0) 1))
			(get (load.static 0) 0)
        )
    )
    (evaluation
        (span 2) (result vector 1)
		(local vector 1)
        (store.local 0 
			(add 
				(exp (load.trace 0) (load.const 0))
                (get (load.static 0) 2)))
        (sub
            (load.trace 1)
            (add
				(mul (load.local 0)	(get (load.static 0) 1))
				(get (load.static 0) 0))
		)
	)
    (export main (init seed) (steps 16)))
`;
// EXAMPLE CODE
// ================================================================================================
const inputs = [
    [3n, 4n, 5n, 6n]
];
// instantiate AirModule object
const schema = index_1.compile(Buffer.from(source));
const air = index_1.instantiate(schema);
// generate trace table
const pObject = air.initProof(inputs);
const trace = pObject.generateExecutionTrace([inputs[0][0]]);
// generate constraint evaluation table
const pPolys = air.field.interpolateRoots(pObject.executionDomain, trace);
const cEvaluations = pObject.evaluateTracePolynomials(pPolys);
console.log('done!');
//# sourceMappingURL=mimcWithInputs.js.map