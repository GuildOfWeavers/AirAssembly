import { compile, instantiate, analyze } from '../index';

const schema = compile(Buffer.from(`
(module
    (field prime 96769)
    (const 
        (scalar 3)
        (vector 1 2 3 4)
        (matrix (1 2) (3 4)))
    (static
        (input public vector)
        (input public (parent 0) (steps 4))
        (input secret (parent 0) (steps 4))
        (cycle 42 43 170 2209)
        (mask (input 0) (value 1)))
    (transition
        (span 1) (result vector 1)
        (local scalar)
        (store.local 0 (scalar 4))
        (add
            (exp (load.trace 0) (scalar 3))
            (get (load.static 0) 1)))
    (evaluation
        (span 2) (result vector 1)
        (sub
            (load.trace 1)
            (add
                (exp (load.trace 0) (load.const 0))
                (get (load.static 0) 1)))))
`));

console.log(schema.toString());

const stats = analyze(schema);
const air = instantiate(schema);

const pObject = air.initProof([[1n, 2n, 3n, 4n], [[1n, 2n], [3n, 4n], [5n, 6n], [7n, 8n]], [[11n, 12n], [13n, 14n], [15n, 16n], [17n, 18n]]], 8);
const trace = pObject.generateExecutionTrace();
const pPolys = air.field.interpolateRoots(pObject.executionDomain, trace);
const pEvaluations = air.field.evalPolysAtRoots(pPolys, pObject.evaluationDomain);
const cEvaluations = pObject.evaluateTracePolynomials(pPolys);

console.log('done!');