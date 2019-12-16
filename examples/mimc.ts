// IMPORTS
// ================================================================================================
import { compile, instantiate } from '../index';

// SOURCE CODE
// ================================================================================================
const source = `
(module
    (field prime 340282366920938463463374607393113505793)
    (const scalar $alpha 3)
    (function $mimcRound
        (result vector 1)
        (param $state vector 1) (param $roundKey scalar)
        (add 
            (exp (load.param $state) (load.const $alpha))
            (load.param $roundKey)))
    (export mimc
        (registers 1) (constraints 1) (steps 1024)
        (static
            (cycle (prng sha256 0x4d694d43 64)))
        (init
            (param $seed vector 1)
            (load.param $seed))
        (transition
            (call $mimcRound (load.trace 0) (get (load.static 0) 0)))
        (evaluation
            (sub
                (load.trace 1)
                (call $mimcRound (load.trace 0) (get (load.static 0) 0))))))
`;

// EXAMPLE CODE
// ================================================================================================

// instantiate AirModule object
const schema = compile(Buffer.from(source));
const air = instantiate(schema, 'mimc', { extensionFactor: 16 });

// generate trace table
const pContext = air.initProvingContext([], [3n]);
const trace = pContext.generateExecutionTrace();

// generate constraint evaluation table
const pPolys = air.field.interpolateRoots(pContext.executionDomain, trace);
const cEvaluations = pContext.evaluateTransitionConstraints(pPolys);

const vContext = air.initVerificationContext(pContext.inputShapes)

const x = air.field.exp(vContext.rootOfUnity, 16n);
const rValues = [trace.getValue(0, 1)];
const nValues = [trace.getValue(0, 2)];

const qValues = vContext.evaluateConstraintsAt(x, rValues, nValues, []);
console.log(qValues);

console.log('done!');