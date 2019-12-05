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
const tracePolys = air.field.interpolateRoots(pObject.compositionDomain, trace);
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
3. This AirModule is then used to create a [Prover](#Prover) object using `createProver()` method.
4. And finally, the Prover is used to generate the execution trace by invoking `generateExecutionTrace()` method.

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
An `AirSchema` object contains a semantic representation of AirAssembly source code. This representation makes it easy to analyze the source code, and serves as the basis for generating [AirModules](#Air-module). An `AirSchema` object can be created by compiling AirAssembly code with the top-level `compile()` function.

`AirSchema` has the following properties:

| Property            | Description |
| ------------------- | ----------- |
| field               | A [finite field](https://github.com/GuildOfWeavers/galois#api) object instantiated for the [field](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#field-declaration) specified for the computation. |
| constants           | An array of `LiteralValue` expressions describing [constants](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#constant-declarations) defined for the computation. |
| staticRegisters     | An array of `StaticRegister` objects describing [static registers](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#static-registers) defined for the computation. |
| transitionFunction  | A `Procedure` object describing [transition function](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#transition-function) expression defined for the computation. |
| constraintEvaluator | A `Procedure` object describing [transition constraint evaluator](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#constraint-evaluator) expression defined for the computation. |
| constraints         | An array of `ConstraintDescriptor` objects containing metadata for each of the defined transition constraints (e.g. constraint degree). |
| maxConstraintDegree | An integer value specifying the highest degree of transition constraints defined for the computation. |
| exports             | A map of [export declarations](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#Export-declarations), where the key is the name of the export, and the value is an `ExportDeclaration` object.  |

Note: definitions for `LiteralValue`, `StaticRegister` and other objects mentioned above can be found in [air-assembly.d.ts](https://github.com/GuildOfWeavers/AirAssembly/blob/master/air-assembly.d.ts) file.

### Air Module
An `AirModule` object contains JavaScript code needed to create [Prover](#Prover) and [Verifier](#Verifier) objects. These objects can then be used to generate execution trace and evaluate transition constraints for a computation. An `AirModule` can be instantiated from an `AirSchema` by using the top-level `instantiate()` function.

`AirModule` has the following properties:

| Property            | Description |
| ------------------- | ----------- |
| field               | A [finite field](https://github.com/GuildOfWeavers/galois#api) object used for all arithmetic operations of the computation. |
| traceRegisterCount  | Number of state registers in the execution trace. |
| staticRegisterCount | Number of static registers in the execution trace. |
| inputDescriptors    | An array of [input descriptor](#Input-descriptor) objects describing inputs required by the computation. |
| constraints         | An array of `ConstraintDescriptor` objects containing metadata for each of the defined transition constraints (e.g. constraint degree). |
| maxConstraintDegree | An integer value specifying the highest degree of transition constraints defined for the computation. |
| extensionFactor     | An integer value specifying how much the execution trace is to be "stretched." |

`AirModule` exposes the following methods:

* **createProver**(inputs?: `any[]`): `Prover`</br>
  Instantiates a [Prover](#Prover) object for a specific instance of the computation. This `prover` can then be used to generate execution trace table and constraint evaluation table for the computation. The `inputs` parameter must be provided only if the computation contains [input registers](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#input-registers). In such a case, the shape of input objects must be in line with the shapes specified by the computation's input descriptors.

* **createVerifier**(inputShapes?: `InputShape[]`, publicInputs?: `any[]`): `Verifier`</br>
  Instantiates a [Verifier](#Verifier) object for a specific instance of the computation. This `verifier` can then be used to evaluate transition constraints at a given point of the evaluation domain of the computation. If the computation contains [input registers](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#input-registers), `inputShapes` parameter must be provided to specify the shapes of consumed inputs. If any of the input registers are public, `publicInputs` parameter must also be provided to specify the actual values of all public inputs consumed by the computation.

#### Prover
A `Prover` object contains properties and methods needed to help generate a proof for a specific instance of a computation. Specifically, a `Prover` can be used to generate an execution trace for a specific set of inputs, and to evaluate transition constraints derived form this trace. To create a `Prover`, use `createProver()` method of [AirModule](#Air-Module) object.

`Prover` has the following properties:

| Property             | Description |
| -------------------- | ----------- |
| field                | Reference to the [finite field](https://github.com/GuildOfWeavers/galois#api) object of the AirModule which describes the computation. |
| rootOfUnit           | Primitive root of unity of the evaluation domain for the instance of the computation. |
| traceLength          | Length of the execution trace for the instance of the computation. |
| extensionFactor      | Extension factor of the execution trace. |
| inputShapes          | Shapes of all input registers for the instance of the computation. |
| executionDomain      | A [vector](https://github.com/GuildOfWeavers/galois#vectors) defining domain of the execution trace. |.
| evaluationDomain     | A [vector](https://github.com/GuildOfWeavers/galois#vectors) defining domain of the low-degree extended execution trace. The length of the evaluation domain is equal to `traceLength * extensionFactor`. |
| compositionDomain    | A [vector](https://github.com/GuildOfWeavers/galois#vectors) defining domain of the low-degree extended composition polynomial. The length of the composition domain is equal to `traceLength * compositionFactor`, where `compositionFactor` is set to be the smallest power of 2 greater than or equal to the highest constraint degree of the computation. For example, if highest constraint degree is `3`, the `compositionFactor` will be set to `2`. |
| secretRegisterTraces | Values of secret input registers evaluated over the evaluation domain. |

`Prover` exposes the following methods:

* **generateExecutionTrace**(seed?: `bigint[]`): `Matrix`</br>
  Generates an execution trace for a computation. The `seed` parameter must be provided only if the seed vector is used in the main export expression of the computation's AirAssembly definition. The return value is a [matrix](https://github.com/GuildOfWeavers/galois#matrixes) where each row corresponds to a dynamic register, and every column corresponds to a step in a computation (i.e. the number of columns will be equal to the length of the execution trace).

* **evaluateTransitionConstraints**(tracePolys: `Matrix`): `Matrix`</br>
  Evaluates transition constraints for a computation. The `tracePolys` parameter is a [matrix](https://github.com/GuildOfWeavers/galois#matrixes) where each row represents a polynomial interpolated from a corresponding register of the execution trace. The return value is a [matrix](https://github.com/GuildOfWeavers/galois#matrixes) where each row represents a  transition constraint evaluated over the composition domain.

#### Verifier
A `Verifier` object contains properties and methods needed to help verify a proof of an instance of a computation (i.e. instance of a computation for a specific set of inputs). Specifically, a `Verifier` can be used to evaluate transition constraints at a specific point of an evaluation domain. To create a `Verifier`, use `createVerifier()` method of [AirModule](#Air-Module) object.

`Verifier` has the following properties:

| Property             | Description |
| -------------------- | ----------- |
| field                | Reference to the [finite field](https://github.com/GuildOfWeavers/galois#api) object of the AirModule which describes the computation. |
| rootOfUnit           | Primitive root of unity of the evaluation domain for the instance of the computation. |
| traceLength          | Length of the execution trace for the instance of the computation. |
| extensionFactor      | Extension factor of the execution trace. |
| inputShapes          | Shapes of all input registers for the instance of the computation. |

`Verifier` exposes the following methods:

* **evaluateConstraintsAt**(x: `bigint`, rValues: `bigint[]`, nValues: `bigint[]`, sValues: `bigint[]`): `bigint[]`</br>
  Returns an array of values resulting from evaluating transition constraints at point `x`. For example, if the computation is defined by a single transition constraint, an array with one value will be returned. The meaning of the parameters is as follows:
  * `x` is the point of the evaluation domain corresponding to the current step of the computation.
  * `rValues` is an array of dynamic register values at the current step of the computation.
  * `nValues` is an array of dynamic register values at the next step of the computation.
  * `sValues` is an array of secret register values at the current step of the computation.

#### Input descriptor
An `InputDescriptor` object contains information about an [input register](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#input-registers) defined for the computation. `InputDescriptor` has the following properties:

| Property   | Description |
| -----------| ----------- |
| rank       | An integer value indicating the position of the register in the input dependency tree. For example, rank of a register without parents is `0`, rank of a register with a single ancestor is `1`, rank of register with 2 ancestors is `2` etc. |
| secret     | A boolean value indicating wither the inputs for the register are public or secret. |
| binary     | A boolean value indicating whether the register can accept only binary values (ones and zeros). |
| offset     | A signed integer value specifying the number of steps by which an input value is to be shifted in the execution trace. |
| parent     | An integer value specifying an index of the parent input register. If the register has no parents, this property will be `undefined`. |
| steps      | An integer value specifying the number of steps by which a register trace is to be expanded for each input value. For non-leaf registers, this property will be `undefined`. |

# License
[MIT](/LICENSE) © 2019 Guild of Weavers