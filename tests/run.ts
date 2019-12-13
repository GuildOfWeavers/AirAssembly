import { compile, instantiate, analyze, prng } from '../index';

const schema = compile(Buffer.from(`
(module
    (field prime 96769)
    (const $alpha scalar 3)
    (function $mimcRound
        (result vector 1)
        (param $state vector 1) (param $key scalar)
        (add 
            (exp (load.param $state) (load.const $alpha))
            (load.param $key)))
    (export main
		(registers 1) (constraints 1) (steps 16)
		(static
			(input secret vector (steps 16) (shift -1))
			(mask inverted (input 0))
            (cycle (prng sha256 0x4d694d43 16)))
        (init
            (vector (scalar 1)))
		(transition
			(call $mimcRound (load.trace 0) (get (load.static 0) 2)))
		(evaluation
			(sub
				(load.trace 1)
				(call $mimcRound (load.trace 0) (get (load.static 0) 2))))
	
	)
)
`));

console.log(schema.toString());

const inputs = [
    [3n, 4n, 5n, 6n]
];

const air = instantiate(schema);

const pContext = air.initProvingContext(inputs, [3n]);
const trace = pContext.generateExecutionTrace();
const pPolys = air.field.interpolateRoots(pContext.executionDomain, trace);
const pEvaluations = air.field.evalPolysAtRoots(pPolys, pContext.evaluationDomain);
const cEvaluations = pContext.evaluateTransitionConstraints(pPolys);

const qPolys = air.field.interpolateRoots(pContext.compositionDomain, cEvaluations);
const qEvaluations = air.field.evalPolysAtRoots(qPolys, pContext.evaluationDomain);

const sEvaluations = pContext.secretRegisterTraces[0];

const vContext = air.initVerificationContext(pContext.inputShapes)

const x = air.field.exp(vContext.rootOfUnity, 2n);
const rValues = [pEvaluations.getValue(0, 2)];
const nValues = [pEvaluations.getValue(0, 10)];
const hValues = sEvaluations ? [sEvaluations.getValue(2)] : [];

const qValues = vContext.evaluateConstraintsAt(x, rValues, nValues, hValues);

console.log(qEvaluations.getValue(0, 2) === qValues[0]);

const ptest = prng.sha256(Buffer.from('4d694d43', 'hex'), 32, air.field);

console.log('done!');