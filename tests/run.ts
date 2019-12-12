import { compile, instantiate, analyze, prng } from '../index';

const schema = compile(Buffer.from(`
(module
    (field prime 96769)
    (const 
        (scalar 3))
    (static
        (input secret vector (steps 16) (shift -1))
        (mask inverted (input 0))
        (cycle (prng sha256 0x4d694d43 16)))
    (function $test
        (width 2)
        (param vector 2) (param scalar)
        (local $temp vector 2)
        (store.local $temp
            (add (load.param 0) (load.param 1) ))
        (exp (load.local $temp) (scalar 2)))
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