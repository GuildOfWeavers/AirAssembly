import { compile, instantiate, analyze } from '../index';
import { compressProcedure } from '../lib/analysis/compressor';

const schema = compile(Buffer.from(`
(module
    (field prime 96769)
    (const 
        (scalar 3))
    (static
        (cycle 42 43 170 2209))
    (transition
        (span 1) (result vector 1)
        (add 
            (exp (load.trace 0) (load.const 0))
            (get (load.static 0) 0)))
    (evaluation
        (span 2) (result vector 1)
        (sub
            (load.trace 1)
            (add
                (exp (load.trace 0) (load.const 0))
                (get (load.static 0) 0))))
    (export main (init (vector 3)) (steps 32))
    (export mimc_128 (steps 256)))
`));

console.log(schema.toString());

const inputs = [
    [1n, 2n, 3n, 4n],                                   // public
    [[1n, 2n], [3n, 4n], [5n, 6n], [7n, 8n]],           // public
    [[11n, 12n], [13n, 14n], [15n, 16n], [17n, 18n]]    // secret
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

const vObject = air.initVerification(pObject.inputShapes, inputs.slice(0, 2))

const x = air.field.exp(vObject.rootOfUnity, 2n);
const rValues = [pEvaluations.getValue(0, 2)];
const nValues = [pEvaluations.getValue(0, 10)];
const hValues = sEvaluations ? [sEvaluations.getValue(2)] : [];

const qValues = vObject.evaluateConstraintsAt(x, rValues, nValues, hValues);

console.log(qEvaluations.getValue(0, 2) === qValues[0]);

console.log('done!');