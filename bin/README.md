# AirAssembly
This library contains specifications and JavaScript runtime for AirAssembly - a language for encoding Algebraic Intermediate Representation (AIR) of computations. AIR is a representation used in [zk-STARKs](https://eprint.iacr.org/2018/046) to construct succinct proofs of computation.

AirAssembly is a low-level language and is intended to be a compilation target for other, higher-level, languages (e.g. [AirScript](https://github.com/GuildOfWeavers/AirScript)). It uses a simple s-expression-based syntax to specify:

1. Inputs required by a computation.
2. Logic for generating execution trace for the computation.
3. Logic for evaluating transition constraints for the computation.
4. Metadata needed to compose the computation with other computations.

Full specifications for AirAssembly can be found [here](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs).

## Usage
This library is not intended for standalone use, but is rather meant to be included as a component into STARK provers (e.g. [genSTARK](https://github.com/GuildOfWeavers/genSTARK)). Nevertheless, you can install it separately like so:

```bash
$ npm install @guildofweavers/air-assembly --save
```

Once installed, you can use the library to compile AirAssembly source code into AirModules, and then use these modules to generate execution trace tables and constraint evaluation tables for computations.

The code below illustrates how to do this on the example of a [MiMC computation](https://vitalik.ca/general/2018/07/21/starks_part_3.html#mimc). Other examples can be found [here](https://github.com/GuildOfWeavers/AirAssembly/tree/master/examples).

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
const tracePolys = air.field.interpolateRoots(pObject.executionDomain, trace);
const constraintEvaluations = pObject.evaluateTransitionConstraints(tracePolys);
```

## API

Complete API definitions can be found in [air-assembly.d.ts](/air-assembly.d.ts). Here is a quick overview of the provided functionality.

### Top-level functions
The library exposes a small set of functions that can be used to compile AirAssembly source code, instantiate AirModules, and perform basic analysis of the underlying AIR. These functions are:

* **compile**(source: `Buffer` | `string`, limits?: `StarkLimits`): `AirSchema`<br />
  Parses and compiles AirAssembly source code into an [AirSchema](#Air-Schema) object. If `source` parameter is a `Buffer`, it is assumed to contain AirAssembly code. If `source` is a `string`, it is assumed to be a path to a file containing AirAssembly code. If `limits` parameter is provided, generated `AirSchema` will be validated against these limits.

* **instantiate**(schema: `AirSchema`, options?: `ModuleOptions`): `AirModule`<br />
  Creates an [AirModule](#Air-Module) object from the specified `schema`. The `AirModule` can then be used to generate execution trace tables and evaluate transition constraints. The optional `options` parameter can be used to control instantiation of the `AirModule`.

* **analyze**(schema: `AirSchema`): `SchemaAnalysisResult`<br />
  Performs basic analysis of the specified `schema` to infer such things as degree of transition constraints, number of additions and multiplications needed to evaluate transition function etc.

#### Air module options
When instantiating an `AirModule` object, an `AirModuleOptions` object can be provided to specify any of the following parameters for the module:

| Property            | Description |
| ------------------- | ----------- |
| limits              | [Limits](#Stark-limits) to be imposed on the instantiated module. If not provided, default limit values will be used. |
| wasmOptions         | Options for finite fields which can take advantage of [WebAssembly optimization](https://github.com/GuildOfWeavers/galois#wasm-optimization). This property can also be set to a boolean value to turn the optimization on or off. |
| extensionFactor     | Number by which the execution trace is to be "stretched." Must be a power of 2 at least 2x of the highest constraint degree. This property is optional, the default is smallest power of 2 that is greater than 2x of the highest constraint degree. |

#### Stark limits
`AirSchema` and `AirModule` objects can be validated against the following set of limits:

| Property            | Description |
| ------------------- | ----------- |
| maxTraceLength      | Maximum number of steps in an execution trace; defaults to 2^20 |
| maxTraceRegisters   | Maximum number of state registers; defaults to 64 |
| maxStaticRegisters  | Maximum number of static registers; defaults to 64 |
| maxConstraintCount  | Maximum number of transition constraints; defaults to 1024 |
| maxConstraintDegree | Highest allowed degree of transition constraints; defaults to 16 |

### Generating execution trace

### Evaluating transition constraints

### Air Schema

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

### Air Module

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