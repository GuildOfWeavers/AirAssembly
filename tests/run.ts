import { compile, instantiate, analyze } from '../index';

const schema = compile(Buffer.from(`
(module
    (field prime 96769)
    (const 
        (scalar 3))
    (static
        (input secret vector (steps 8))
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
    (export main (init (vector 0)) (steps 8)))
`));

console.log(schema.toString());

const inputs = [
    [3n, 4n, 5n, 6n]
];

const air = instantiate(schema);

const pObject = air.initProof(inputs);
const trace = pObject.generateExecutionTrace();
const pPolys = air.field.interpolateRoots(pObject.executionDomain, trace);
const pEvaluations = air.field.evalPolysAtRoots(pPolys, pObject.evaluationDomain);
const cEvaluations = pObject.evaluateTracePolynomials(pPolys);

const qPolys = air.field.interpolateRoots(pObject.compositionDomain, cEvaluations);
const qEvaluations = air.field.evalPolysAtRoots(qPolys, pObject.evaluationDomain);

const sEvaluations = pObject.secretRegisterTraces[0];

const vObject = air.initVerification(pObject.inputShapes)

const x = air.field.exp(vObject.rootOfUnity, 2n);
const rValues = [pEvaluations.getValue(0, 2)];
const nValues = [pEvaluations.getValue(0, 10)];
const hValues = sEvaluations ? [sEvaluations.getValue(2)] : [];

const qValues = vObject.evaluateConstraintsAt(x, rValues, nValues, hValues);

console.log(qEvaluations.getValue(0, 2) === qValues[0]);

console.log('done!');