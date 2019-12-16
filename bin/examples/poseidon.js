"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const index_1 = require("../index");
// SOURCE CODE
// ================================================================================================
const source = `
(module
    (field prime 340282366920938463463374607393113505793)
    (const
        (scalar 5)
        (matrix
            (214709430312099715322788202694750992687  54066244720673262921467176400601950806 122144641489288436529811410313120680228)
            ( 83122512782280758906222839313578703456 163244785834732434882219275190570945140  65865044136286518938950810559808473518)
            ( 12333142678723890553278650076570367543 308304933036173868454178201249080175007  76915505462549994902479959396659996669)))
    (static
        (cycle 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 0)
        (cycle (prng sha256 0x486164657331 64))
        (cycle (prng sha256 0x486164657332 64))
        (cycle (prng sha256 0x486164657333 64)))
	(functions
		(define #init
			(param scalar) (param scalar) (result vector 3)
			(vector (load.param 0) (load.param 1) (scalar 0))
		)
		(define #round
			(param matrix 3 3) (param vector 3) (param scalar) (param vector 3) (param scalar) (result vector 3)
			(local vector 3) (local vector 3)
			(store.local 0
				(prod
					(load.param 0)
					(exp
						(add (load.param 3) (load.param 1))
						(load.param 2))))
			(store.local 1
				(prod
					(load.param 0)
					(vector
						(add (slice (load.param 3) 0 1) (slice (load.param 1) 1 2))
						(exp
							(add (get (load.param 3) 2) (get (load.param 1) 3))
							(load.param 2)))))
			(add
				(mul (load.local 0) (load.param 0))
				(mul (load.local 1) (sub (scalar 1)  (load.param 0)))))
	)
    (transition
        (span 1) (result vector 3)
        (call 1
			(load.const 1)
			(slice (load.static 0) 1 3)
			(load.const 0)
			(load.trace 0)
			(get (load.static 0) 0))
    )
    (evaluation
        (span 2) (result vector 3)
        (sub
            (load.trace 1)
            (call 1
				(load.const 1)
				(slice (load.static 0) 1 3)
				(load.const 0)
				(load.trace 0)
				(get (load.static 0) 0)))
	)
    (export main (init (call 0 (get seed 0) (get seed 1))) (steps 64)))
`;
// EXAMPLE CODE
// ================================================================================================
const inputs = [42n, 43n, 0n];
// instantiate AirModule object
const schema = index_1.compile(Buffer.from(source));
const stats = index_1.analyze(schema, 'poseidon');
const air = index_1.instantiate(schema, 'poseidon');
// generate trace table
const pContext = air.initProvingContext([], inputs);
const trace = pContext.generateExecutionTrace();
// generate constraint evaluation table
const pPolys = air.field.interpolateRoots(pContext.executionDomain, trace);
const cEvaluations = pContext.evaluateTransitionConstraints(pPolys);
console.log('done!');
//# sourceMappingURL=poseidon.js.map