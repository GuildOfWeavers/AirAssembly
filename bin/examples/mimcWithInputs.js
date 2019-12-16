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
    (const scalar $alpha 3)
    (function $mimcRound
        (result vector 1)
        (param $state vector 1) (param $roundKey scalar)
        (add 
            (exp (load.param $state) (load.const $alpha))
            (load.param $roundKey)))
    (export mimc
        (registers 1) (constraints 1) (steps 16)
        (static
            (input secret vector (steps 16) (shift -1))
            (mask inverted (input 0))
            (cycle (prng sha256 0x4d694d43 16)))
        (init)
        (transition
            (local vector 1)
            (store.local 0 
                (call $mimcRound (load.trace 0) (get (load.static 0) 0)))
            (add
                (mul (load.local 0)	(get (load.static 0) 1))
                (get (load.static 0) 0)))
        (evaluation
            (local vector 1)
            (store.local 0 
                (call $mimcRound (load.trace 0) (get (load.static 0) 0)))
            (sub
                (load.local 1)
                (add
                    (mul (load.local 0)	(get (load.static 0) 1))
                    (get (load.static 0) 0))))))
`;
// EXAMPLE CODE
// ================================================================================================
const inputs = [
    [3n, 4n, 5n, 6n]
];
// instantiate AirModule object
const schema = index_1.compile(Buffer.from(source));
const air = index_1.instantiate(schema, 'mimc');
// generate trace table
const pContext = air.initProvingContext(inputs, [inputs[0][0]]);
const trace = pContext.generateExecutionTrace();
// generate constraint evaluation table
const pPolys = air.field.interpolateRoots(pContext.executionDomain, trace);
const cEvaluations = pContext.evaluateTransitionConstraints(pPolys);
console.log('done!');
//# sourceMappingURL=mimcWithInputs.js.map