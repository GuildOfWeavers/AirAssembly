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
        (input secret vector (steps 64) (shift -1))
        (input secret vector (steps 64) (shift -1))
        (mask inverted (input 0))
        (cycle 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 0)
        (cycle (prng sha256 0x486164657331 64))
        (cycle (prng sha256 0x486164657332 64))
        (cycle (prng sha256 0x486164657333 64)))
    (transition
        (span 1) (result vector 3)
        (local vector 3) (local vector 3)
        (store.local 0 
            (prod
                (load.const 1)
                (exp
                    (add (load.trace 0) (slice (load.static 0) 4 6))
                    (load.const 0))))
        (store.local 1
            (prod
                (load.const 1)
                (vector
                    (add (slice (load.trace 0) 0 1) (slice (load.static 0) 4 5))
                    (exp
                        (add (get (load.trace 0) 2) (get (load.static 0) 6))
                        (load.const 0)))))
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
                (load.const 1)
                (exp
                    (add (load.trace 0) (slice (load.static 0) 4 6))
                    (load.const 0))))
        (store.local 1
            (prod
                (load.const 1)
                (vector
                    (add (slice (load.trace 0) 0 1) (slice (load.static 0) 4 5))
                    (exp
                        (add (get (load.trace 0) 2) (get (load.static 0) 6))
                        (load.const 0)))))
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
const schema = index_1.compile(Buffer.from(source));
const stats = index_1.analyze(schema);
const air = index_1.instantiate(schema);
// generate trace table
const pContext = air.initProvingContext(inputs, [inputs[0][0], inputs[1][0], 0n]);
const trace = pContext.generateExecutionTrace();
// generate constraint evaluation table
const pPolys = air.field.interpolateRoots(pContext.executionDomain, trace);
const cEvaluations = pContext.evaluateTransitionConstraints(pPolys);
console.log('done!');
//# sourceMappingURL=poseidon.js.map