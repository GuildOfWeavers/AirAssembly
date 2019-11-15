import { compile, instantiate } from '../index';

const m = instantiate(Buffer.from(`
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

//console.log(m.toString());
const c = m.initProof([[1n, 2n, 3n, 4n], [[1n, 2n], [3n, 4n], [5n, 6n], [7n, 8n]], [[11n, 12n], [13n, 14n], [15n, 16n], [17n, 18n]]], 8);
const trace = c.generateExecutionTrace();
console.log('done!');