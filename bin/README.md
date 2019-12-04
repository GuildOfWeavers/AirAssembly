# AirAssembly
This library contains specifications and JavaScript runtime for AirAssembly - a language for encoding Algebraic Intermediate Representation (AIR) of computations. AIR is a representation used in [zk-STARKs](https://eprint.iacr.org/2018/046) to construct succinct proofs of computational integrity.

AirAssembly is a low-level language and is intended to be a compilation target for other, higher-level, languages (e.g. [AirScript](https://github.com/GuildOfWeavers/AirScript)). It uses a simple s-expression-based syntax to specify:

1. Inputs required by a computation.
2. Logic for generating execution trace for the computation.
3. Logic for evaluating transition constraints for the computation.
4. Metadata needed to compose the computation with other computations.

Full specifications for AirAssembly can be found [here](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs).

## Usage
This library is not intended for standalone use, but is rather meant to be a component used in STARK provers (e.g. [genSTARK](https://github.com/GuildOfWeavers/genSTARK)). Nevertheless, you can install it separately like so:

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
        (cycle (prng sha256 0x4d694d43 64)))
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
    (export main (init seed) (steps 32)))`;

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

Complete API definitions can be found in [air-assembly.d.ts](https://github.com/GuildOfWeavers/AirAssembly/blob/master/air-assembly.d.ts). Here is a quick overview of the provided functionality.

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
| extensionFactor     | Number by which the execution trace is to be "stretched." Must be a power of 2 at least 2x of the highest constraint degree. This property is optional, the default is the smallest power of 2 that is greater than 2x of the highest constraint degree. |

#### Stark limits
`StarkLimits` object defines limits against which `AirSchema` and `AirModule` objects are validated. `StarkLimits` objects can contain any of the following properties:

| Property            | Description |
| ------------------- | ----------- |
| maxTraceLength      | Maximum number of steps in an execution trace; defaults to 2<sup>20</sup> |
| maxTraceRegisters   | Maximum number of state registers; defaults to 64 |
| maxStaticRegisters  | Maximum number of static registers; defaults to 64 |
| maxConstraintCount  | Maximum number of transition constraints; defaults to 1024 |
| maxConstraintDegree | Highest allowed degree of transition constraints; defaults to 16 |

### Generating execution trace
To generate an execution trace for a computation defined by AirAssembly source code, the following steps should be taken:

1. AirAssembly source code needs to be compiled into AirSchema using top-level `compile()` function.
2. The resulting AirSchema is then passed to the top-level `instantiate()` function to generate an AirModule.
3. This AirModule is then used to create a proof object using `initProof()` method. 
4. And finally, the proof object is used to generate the execution trace by invoking `generateExecutionTrace()` method.

The code block bellow illustrates these steps:

```TypeScript
const schema = compile(Buffer.from(source));
const air = instantiate(schema, { extensionFactor: 16 });
const pObject = air.initProof();
const trace = pObject.generateExecutionTrace([3n]);
```
In the above:
* `source` is a variable with a string containing AirAssembly source code similar to the one one shown in the [usage](#Usage) section.
* When we instantiate an AirModule, we set the extension factor to `16`.
* When we generate the execution trace, we seed the execution trace table with value `3`. That is, the value of our one and only state register at step 0 will be set to `3`.

### Evaluating transition constraints
```TypeScript
const tracePolys = air.field.interpolateRoots(pObject.executionDomain, trace);
const constraintEvaluations = pObject.evaluateTransitionConstraints(tracePolys);
```

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
| field               | [Finite field](https://github.com/GuildOfWeavers/galois#api) object used for all arithmetic operations in the AirModule. |
| traceRegisterCount  | Number of state registers in the execution trace. |
| staticRegisterCount | Number of static registers in the execution trace. |
| inputDescriptors    | |
| constraints         | |
| maxConstraintDegree | Highest degree of transition constraints. |
| extensionFactor     | Execution trace extension factor. |

* **initProof**(inputs: `any[]`): `ProofObject`
* **initVerification**(inputShapes?: `InputShape[]`, publicInputs?: `any[]`): `VerificationObject`

#### Proof object
A `ProofObject` contains properties and methods needed to help generate a proof for a specific instance of a computation. Specifically, a `ProofObject` can be used to generate an execution trace for a specific set of inputs, and to evaluate transition constraints derived form this trace.

* **generateExecutionTrace**(seed?: `bigint[]`): `Matrix`</br>
  Generates an execution trace for the computation described by the parent AirModule. If the computation references a seed vector in the main export expression, then a `seed` parameter must be provided. The return value is a [matrix](https://github.com/GuildOfWeavers/galois#matrixes) where every row corresponds to a dynamic register, and every column corresponds to step in a computation. For example, if our computation has a single register and runs for 32 steps, the returned matrix will contain a single row with 32 columns.

* **evaluateTransitionConstraints**(polynomials: `Matrix`): `Matrix`

All proof objects also contain the following properties:

| Property             | Description |
| -------------------- | ----------- |
| field                | Reference to the [finite field](https://github.com/GuildOfWeavers/galois#api) object of the parent AirModule. |
| rootOfUnit           | |
| traceLength          | |
| extensionFactor      | |
| inputShapes          | |
| executionDomain      | Domain of the execution trace. |
| evaluationDomain     | Domain of the low-degree extended execution trace. |
| compositionDomain    | Domain of the low-degree extended composition polynomial |
| secretRegisterTraces | Values of secret registers evaluated over evaluation domain |

#### Verification object
A `VerificationObject` contains properties and methods needed to help verify a proof of an instance of a computation (i.e. instance of a computation for a specific set of inputs). Specifically, a `VerificationObject` can be used to evaluate transition constraints at a specific point of an evaluation domain using `evaluateConstraintsAt()` method. It is assumed that an external STARK verifier will parse a STARK proof and will read decommitments to trace register states from it before invoking `evaluateConstraintsAt()` method. The method has the following signature:

**evaluateConstraintsAt**(x: `bigint`, rValues: `bigint[]`, nValues: `bigint[]`, sValues: `bigint[]`): `bigint[]`

where:
* `x` is the point of the evaluation domain corresponding to the current step of the computation.
* `rValues` is an array of dynamic register values at the current step of the computation.
* `nValues` is an array of dynamic register values at the next step of the computation.
* `sValues` is an array of secret register values at the current step of the computation.

The method returns an array of constraint evaluations at point `x`. For example, if the computation is defined by a single transition constraint, an array with one value will be returned.

All verification objects also contain the following properties:

| Property             | Description |
| -------------------- | ----------- |
| field                | Reference to the [finite field](https://github.com/GuildOfWeavers/galois#api) object of the AirModule which describes the computation. |
| rootOfUnit           | Primitive root of unity of the evaluation domain for the instance of the computation. |
| traceLength          | Length of the execution trace for the instance of the computation. |
| extensionFactor      | Extension factor of the execution trace. |
| inputShapes          | Shapes of all input registers for the instance of the computation. |

# License
[MIT](/LICENSE) © 2019 Guild of Weavers