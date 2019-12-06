import { compile, instantiate, analyze } from '../index';

const schema = compile(Buffer.from(`
(module
    (field prime 96769)
    (const 
        (scalar 3))
    (static
        (input secret vector (steps 16) (shift -1))
        (mask inverted (input 0))
        (cycle (prng sha256 0x4d694d43 16)))
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

const prover = air.createProver(inputs);
const trace = prover.generateExecutionTrace([3n]);
const pPolys = air.field.interpolateRoots(prover.executionDomain, trace);
const pEvaluations = air.field.evalPolysAtRoots(pPolys, prover.evaluationDomain);
const cEvaluations = prover.evaluateTransitionConstraints(pPolys);

const qPolys = air.field.interpolateRoots(prover.compositionDomain, cEvaluations);
const qEvaluations = air.field.evalPolysAtRoots(qPolys, prover.evaluationDomain);

const sEvaluations = prover.secretRegisterTraces[0];

const verifier = air.createVerifier(prover.inputShapes)

const x = air.field.exp(verifier.rootOfUnity, 2n);
const rValues = [pEvaluations.getValue(0, 2)];
const nValues = [pEvaluations.getValue(0, 10)];
const hValues = sEvaluations ? [sEvaluations.getValue(2)] : [];

const qValues = verifier.evaluateConstraintsAt(x, rValues, nValues, hValues);

console.log(qEvaluations.getValue(0, 2) === qValues[0]);

console.log('done!');