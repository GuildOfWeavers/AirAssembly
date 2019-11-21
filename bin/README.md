# AirAssembly
This library contains specifications and a JavaScript runtime for AirAssembly - a language for encoding Algebraic Intermediate Representation (AIR) of computations. AIR is a representation used in [zk-STARKs](https://eprint.iacr.org/2018/046) to construct succinct proofs of computation.

AirAssembly is a low-level language and is intended to be a compilation target for other, high-level languages (e.g. [AirScript](https://github.com/GuildOfWeavers/AirScript)). It uses a simple s-expression-based syntax to specify:

1. Inputs required by a computation.
2. Logic for generating execution trace for the computation.
3. Logic for evaluating transition constraints for the computation.
4. Metadata needed to compose the computation with other computations.

Full specifications for AirAssembly can be found [here](/specs).

## Usage
This module is not intended for standalone use, but is rather meant to be included as a component in STARK provers (e.g. [genSTARK](https://github.com/GuildOfWeavers/genSTARK)). Nevertheless, you can install it separately like so:

```bash
$ npm install @guildofweavers/air-assembly --save
```

Once installed, you can use the module to compile AirAssembly source code into AirModules, and use them to generate execution trace tables and constraint evaluation tables for computations.

The code below illustrates how to do this on the example of a [MiMC computation](https://vitalik.ca/general/2018/07/21/starks_part_3.html#mimc). Other examples can be found [here](/examples).

```TypeScript
import { compile, instantiate } from '@guildofweavers/air-assembly';

const source = `
(module
    (field prime 4194304001)
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
    (export main (init seed) (steps 32)))
`;

// instantiate AirModule object
const schema = compile(Buffer.from(source));
const air = instantiate(schema);

// generate trace table
const pObject = air.initProof();
const trace = pObject.generateExecutionTrace([3n]);

// generate constraint evaluation table
const pPolys = air.field.interpolateRoots(pObject.executionDomain, trace);
const cEvaluations = pObject.evaluateTracePolynomials(pPolys);
```

## API

Complete API definitions can be found in [air-assembly.d.ts](/air-assembly.d.ts). Here is a quick overview of the provided functionality:

* **compile**(source: `Buffer` | `string`, limits?: `StarkLimits`): `AirSchema`
* **instantiate**(schema: `AirSchema`, options?: `ModuleOptions`): `AirModule`
* **analyze**(schema: `AirSchema`): `SchemaAnalysisResult`

### AirSchema

| Property            | Description |
| ------------------- | ----------- |
| field               | |
| constants           | |
| staticRegisters     | |
| transitionFunction  | |
| constraintEvaluator | |
| constraints         | |
| maxConstraintDegree | |
| exports             | |

### AirModule

| Property            | Description |
| ------------------- | ----------- |
| field               | |
| traceRegisterCount  |
| staticRegisterCount |
| inputDescriptors    |
| constraints         |
| maxConstraintDegree |
| extensionFactor     |

* **initProof**(inputs: `any[]`): `ProofObject`
* **initVerification**(inputShapes?: `InputShape[]`, publicInputs?: `any[]`): `VerificationObject`

#### Proof object

#### Verification object