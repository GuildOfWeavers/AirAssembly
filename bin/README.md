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
const context = air.initProvingContext([], [3n]);
const trace = context.generateExecutionTrace();

// generate constraint evaluation table
const tracePolys = air.field.interpolateRoots(context.executionDomain, trace);
const constraintEvaluations = context.evaluateTransitionConstraints(tracePolys);
```

## API

Complete API definitions can be found in [air-assembly.d.ts](https://github.com/GuildOfWeavers/AirAssembly/blob/master/air-assembly.d.ts). Here is a quick overview of the provided functionality.

### Top-level functions
The library exposes a small set of functions that can be used to compile AirAssembly source code, instantiate AirModules, and perform basic analysis of the underlying AIR. These functions are:

* **compile**(source: `Buffer` | `string`, limits?: `StarkLimits`): `AirSchema`<br />
  Parses and compiles AirAssembly source code into an [AirSchema](#Air-Schema) object. If `source` parameter is a `Buffer`, it is expected to contain AirAssembly code. If `source` is a `string`, it is expected to be a path to a file containing AirAssembly code. If `limits` parameter is provided, generated `AirSchema` will be validated against these limits.

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
To generate an execution trace for a computation defined by AirAssembly source code, the following steps should be executed:

1. Compile AirAssembly source code into [AirSchema](#Air-Schema) using the top-level `compile()` function.
2. Pass the resulting `AirSchema` to the top-level `instantiate()` function to create an [AirModule](#Air-Module).
3. Create a [ProvingContext](#Proving-context) by invoking `AirModule.initProvingContext()` method. If the computation contains input registers, then input values for these registers must be passed to the `initProvingContext()` method. This instantiates the `ProvingContext` for a specific set of inputs.
4. Generate the execution trace by invoking `ProvingContext.generateExecutionTrace()` method. If the computation's [main export](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#main-export) uses a seed vector to initialize the execution trace, then an array with seed values must be passed to the `generateExecutionTrace()` method. If the computation does not define a main export, an error will be thrown.

The code block bellow illustrates these steps:

```TypeScript
const schema = compile(Buffer.from(source));
const air = instantiate(schema, { extensionFactor: 16 });
const context = air.initProvingContext([], [3n]);
const trace = context.generateExecutionTrace();
```
In the above:
* `source` is a string variable containing AirAssembly source code similar to the one shown in the [usage](#Usage) section.
* The `AirModule` is instantiated using default limits but setting extension factor to `16`.
* An empty inputs array is passed as the first parameter to the `initProvingContext()` method since the computation shown in the [usage](#Usage) section does not define any input registers.
* A seed array with value `3` is passed as the second parameter to the `initProvingContext()` method since main export initializer uses a `seed` vector to initialize the first row of the execution trace.
* After the code is executed, the `trace` variable will be a [matrix](https://github.com/GuildOfWeavers/galois#matrixes) with 1 row and 32 columns (corresponding to 1 register and 32 steps).

The execution trace for the single register will look like so:
```
[
             3, 1539309651, 3863242857, 3506640509, 1371547896, 215222094,  220283781,  2120321425,
    2290167095, 3044083866, 3673976270, 2694057310,  995327947, 2470701222, 798926004,  2416031839, 
    4124930959,  680273881,  115120944, 2405022753,  963841868, 327198005,  34356700,   1065113318,
    2951801258,  791752781, 1878966595, 2503692690, 1792666246, 3884924604, 3800788053, 2681237718
]
```

### Evaluating transition constraints
Transition constraints described in AirAssembly source code can be evaluated using either as a prover or as a verifier. Both methods are described below.

#### Evaluating transition constraints as a prover
When generating a STARK proof, transition constraints need to be evaluated at all points of the evaluation domain. This can be done efficiently by invoking `ProvingContext.evaluateTransitionConstraints()` method. To evaluate the constraints, the following steps should be executed:

1. Create a proving context and generate an execution trace as described in the [previous section](#Generating-execution-trace).
2. Generate a set of trace polynomials by interpolating execution trace columns over the execution domain.
3. Evaluate the constraints by invoking `ProvingContext.evaluateTransitionConstraints()` method and passing trace polynomials to it.

The code block bellow illustrates steps 2 and 3:
```TypeScript
const tracePolys = air.field.interpolateRoots(context.executionDomain, trace);
const constraintEvaluations = context.evaluateTransitionConstraints(tracePolys);
```
In the above:
* AirModule's `field` object is used to interpolate the execution trace. The [interpolateRoots()](https://github.com/GuildOfWeavers/galois#polynomial-evaluation-and-interpolation) method takes a vector of `x` values as the first parameter, and a matrix of `y` values as the second parameter (the matrix is expected to have a distinct set of `y` values in each row). The output is a matrix where each row contains an interpolated polynomial.
* `evaluateTransitionConstraints()` method returns a [matrix](https://github.com/GuildOfWeavers/galois#matrixes) where each row corresponds to a transition constraint evaluated over the composition domain.

For example, evaluating constraints for AirAssembly code from the [usage](#Usage) section, will produce a matrix with a single row containing the following values:
```
[
    0, 1888826267,  934997684,  522697873,         0, 3636300716,  301925789,  369141145,
    0,  767283131,  270628806, 1668446351,         0, 1739694248, 3247199818, 2569615536,
    0,   44729160, 4039819553, 3564072931,         0, 1616917451, 1151293301, 3209868277,
    0, 3410907990, 4004509077, 4190379432,         0, 3101507817, 3553581961, 2793433224,
    0,  330772896, 4060647779, 2512435701,         0, 3403188821,  235591542, 3772363484,
    0, 2256420389, 2357121513,   61957993,         0, 3272390069,  197242509, 2878395132,
    0,  155740407,  298885317, 3310802262,         0,   19161130,  691333255, 1102311751,
    0, 1751005830, 2349558192, 3473961491,         0, 4006336837,  565227775, 4021023132,
    0, 3315940573,  989407555, 2088778801,         0,  898450568, 3610287112, 3576441219,
    0,  326707597, 2532917782, 3330991749,         0, 4162556873, 1554019377, 4171366685,
    0,  984976271, 2011763604,  728626530,         0, 3611841258, 2245193661, 2605704194,
    0, 2583926003, 3992303847, 2748879594,         0, 2379703446,  430289311, 3052280185,
    0,  179547660, 1215051408, 2628504587,         0, 2862551083, 2740849758,  925951430,
    0, 4000243259,  913649599, 1118200600,         0, 1484209861, 1897468182,  190582872,
    0, 4135707956, 1007284323, 2027805646,         0, 1310083809, 2946378676,  350300836,
    0, 3019962854, 1468795609, 1874742277, 803208359, 4116321517, 3116095172,   77399359
]
```

**Note:** The constraints are evaluated over the composition domain (not evaluation domain). The evaluations can be extended to the full evaluation domain by interpolating them over the composition domain, and then evaluating the resulting polynomials over the evaluation domain. But in practice, to improve performance, the evaluations are first merged into a single vector via random linear combination, and then this single vector is extended to the full evaluation domain.

#### Evaluating transition constraints as a verifier
When verifying a STARK proof, transition constraints need to be evaluated at a small subset of points. This can be done by invoking `VerificationContext.evaluateConstraintsAt()` method which evaluates constraints at a single point of evaluation domain. To evaluate constraints at a single point, the following steps should be executed:

1. Compile AirAssembly source code into [AirSchema](#Air-Schema) using the top-level `compile()` function.
2. Pass the resulting `AirSchema` to the top-level `instantiate()` function to create an [AirModule](#Air-Module).
3. Create a [VerificationContext](#Verification-context) by invoking `AirModule.initVerificationContext()` method. If the computation contains input registers, input shapes for these registers must be passed to the `initVerificationContext()` method. If any of the input registers are public, input values for these registers must also be passed to the method.
4. Evaluate constraints by invoking `VerificationContext.evaluateConstraintsAt()` method and passing to it an x-coordinate of the desired point from the evaluation domain, as well as corresponding values of register traces.

The code block bellow illustrates these steps:
```TypeScript
const schema = compile(Buffer.from(source));
const air = instantiate(schema, { extensionFactor: 16 });
const context = air.initVerificationContext();
const x = air.field.exp(context.rootOfUnity, 16n);
const rValues = [1539309651n], nValues = [3863242857n];
const evaluations = context.evaluateConstraintsAt(x, rValues, nValues, []);
```
In the above:
* `source` is a string variable containing AirAssembly source code similar to the one shown in the [usage](#Usage) section.
* The `AirModule` is instantiated using default limits but setting extension factor to `16`.
* No input shapes or inputs are passed to the `initVerificationContext()` method since the computation shown in the [usage](#Usage) section does not define any input registers. 
* `x` is set to the 17th value in of the execution domain, while `rValues` and `nValues` contain register traces for 2nd and 3rd steps of the computation. This is because when the extension factor is `16`, the 2nd value of the execution trace aligns with the 17th value of the evaluation domain.
* After the code is executed, the `evaluations` variable will be an array with a single value `0`. This is because applying transition function to value `1539309651` (current state of the execution trace) results in `3863242857`, which is the next state of the execution trace.

### Air Schema
An `AirSchema` object contains a semantic representation of AirAssembly source code. This representation makes it easy to analyze the source code, and serves as the basis for generating [AirModules](#Air-module). An `AirSchema` object can be created by compiling AirAssembly code with the top-level `compile()` function.

`AirSchema` has the following properties:

| Property            | Description |
| ------------------- | ----------- |
| field               | A [finite field](https://github.com/GuildOfWeavers/galois#api) object instantiated for the [field](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#field-declaration) specified for the computation. |
| constants           | An array of `LiteralValue` expressions describing [constants](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#constant-declarations) defined for the computation. |
| staticRegisters     | An array of `StaticRegister` objects describing [static registers](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#static-registers) defined for the computation. |
| secretInputCount    | An integer value specifying number of secret [input registers](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#input-registers) defined for the computation. |
| transitionFunction  | A `Procedure` object describing [transition function](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#transition-function) expression defined for the computation. |
| constraintEvaluator | A `Procedure` object describing [transition constraint evaluator](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#constraint-evaluator) expression defined for the computation. |
| constraints         | An array of `ConstraintDescriptor` objects containing metadata for each of the defined transition constraints (e.g. constraint degree). |
| maxConstraintDegree | An integer value specifying the highest degree of transition constraints defined for the computation. |
| exports             | A map of [export declarations](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#Export-declarations), where the key is the name of the export, and the value is an `ExportDeclaration` object. |

Note: definitions for `LiteralValue`, `StaticRegister` and other objects mentioned above can be found in [air-assembly.d.ts](https://github.com/GuildOfWeavers/AirAssembly/blob/master/air-assembly.d.ts) file.

### Air Module
An `AirModule` object contains JavaScript code needed to create [ProvingContext](#Proving-context) and [VerificationContext](#Verification-context) objects. These objects can then be used to generate execution trace and evaluate transition constraints for a computation. An `AirModule` can be instantiated from an `AirSchema` by using the top-level `instantiate()` function.

`AirModule` has the following properties:

| Property            | Description |
| ------------------- | ----------- |
| field               | A [finite field](https://github.com/GuildOfWeavers/galois#api) object used for all arithmetic operations of the computation. |
| traceRegisterCount  | Number of state registers in the execution trace. |
| staticRegisterCount | Number of static registers in the execution trace. |
| inputDescriptors    | An array of [input descriptor](#Input-descriptor) objects describing inputs required by the computation. |
| secretInputCount    | An integer value specifying number of secret [input registers](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#input-registers) defined for the computation. |
| constraints         | An array of `ConstraintDescriptor` objects containing metadata for each of the defined transition constraints (e.g. constraint degree). |
| maxConstraintDegree | An integer value specifying the highest degree of transition constraints defined for the computation. |
| extensionFactor     | An integer value specifying how much the execution trace is to be "stretched." |

`AirModule` exposes the following methods:

* **initProvingContext**(inputs?: `any[]`, seed?: `bigint[]`): `ProvingContext`</br>
  Instantiates a [ProvingContext](#Proving-context) object for a specific instance of the computation. This context can then be used to generate execution trace table and constraint evaluation table for the computation.
  * `inputs` parameter must be provided only if the computation contains [input registers](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#input-registers). In such a case, the shape of input objects must be in line with the shapes specified by the computation's input descriptors.
  *  `seed` parameter must be provided only if the seed vector is used in the [main export](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#main-export) expression of the computation's AirAssembly definition.

* **initVerificationContext**(inputShapes?: `InputShape[]`, publicInputs?: `any[]`): `VerificationContext`</br>
  Instantiates a [VerificationContext](#Verification-context) object for a specific instance of the computation. This context can then be used to evaluate transition constraints at a given point of the evaluation domain of the computation. If the computation contains [input registers](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#input-registers), `inputShapes` parameter must be provided to specify the shapes of consumed inputs. If any of the input registers are public, `publicInputs` parameter must also be provided to specify the actual values of all public inputs consumed by the computation.

#### Proving context
A `ProvingContext` object contains properties and methods needed to help generate a proof for a specific instance of a computation. Specifically, a `ProvingContext` can be used to generate an execution trace for a specific set of inputs, and to evaluate transition constraints derived form this trace. To create a `ProvingContext`, use `initProvingContext()` method of [AirModule](#Air-Module) object.

`ProvingContext` has the following properties:

| Property             | Description |
| -------------------- | ----------- |
| field                | Reference to the [finite field](https://github.com/GuildOfWeavers/galois#api) object of the AirModule which describes the computation. |
| rootOfUnit           | Primitive root of unity of the evaluation domain for the instance of the computation. |
| traceLength          | Length of the execution trace for the instance of the computation. |
| extensionFactor      | Extension factor of the execution trace. |
| constraints          | An array of constraint descriptors with metadata for the defined transition constraints. |
| inputShapes          | Shapes of all input registers for the instance of the computation. |
| executionDomain      | A [vector](https://github.com/GuildOfWeavers/galois#vectors) defining domain of the execution trace. |.
| evaluationDomain     | A [vector](https://github.com/GuildOfWeavers/galois#vectors) defining domain of the low-degree extended execution trace. The length of the evaluation domain is equal to `traceLength * extensionFactor`. |
| compositionDomain    | A [vector](https://github.com/GuildOfWeavers/galois#vectors) defining domain of the low-degree extended composition polynomial. The length of the composition domain is equal to `traceLength * compositionFactor`, where `compositionFactor` is set to be the smallest power of 2 greater than or equal to the highest constraint degree of the computation. For example, if highest constraint degree is `3`, the `compositionFactor` will be set to `2`. |
| secretRegisterTraces | Values of secret input registers evaluated over the evaluation domain. |

`ProvingContext` exposes the following methods:

* **generateExecutionTrace**(): `Matrix`</br>
  Generates an execution trace for a computation. The return value is a [matrix](https://github.com/GuildOfWeavers/galois#matrixes) where each row corresponds to a dynamic register, and every column corresponds to a step in a computation (i.e. the number of columns will be equal to the length of the execution trace).

* **evaluateTransitionConstraints**(tracePolys: `Matrix`): `Matrix`</br>
  Evaluates transition constraints for a computation. The `tracePolys` parameter is a [matrix](https://github.com/GuildOfWeavers/galois#matrixes) where each row represents a polynomial interpolated from a corresponding register of the execution trace. The return value is a [matrix](https://github.com/GuildOfWeavers/galois#matrixes) where each row represents a transition constraint evaluated over the composition domain.

#### Verification context
A `VerificationContext` object contains properties and methods needed to help verify a proof of an instance of a computation (i.e. instance of a computation for a specific set of inputs). Specifically, a `VerificationContext` can be used to evaluate transition constraints at a specific point of an evaluation domain. To create a `VerificationContext`, use `initVerificationContext()` method of [AirModule](#Air-Module) object.

`VerificationContext` has the following properties:

| Property             | Description |
| -------------------- | ----------- |
| field                | Reference to the [finite field](https://github.com/GuildOfWeavers/galois#api) object of the AirModule which describes the computation. |
| rootOfUnit           | Primitive root of unity of the evaluation domain for the instance of the computation. |
| traceLength          | Length of the execution trace for the instance of the computation. |
| extensionFactor      | Extension factor of the execution trace. |
| constraints          | An array of constraint descriptors with metadata for the defined transition constraints. |
| inputShapes          | Shapes of all input registers for the instance of the computation. |

`VerificationContext` exposes the following methods:

* **evaluateConstraintsAt**(x: `bigint`, rValues: `bigint[]`, nValues: `bigint[]`, sValues: `bigint[]`): `bigint[]`</br>
  Returns an array of values resulting from evaluating transition constraints at point `x`. For example, if the computation is defined by a single transition constraint, an array with one value will be returned. The meaning of the parameters is as follows:
  * `x` is the point of the evaluation domain corresponding to the current step of the computation.
  * `rValues` is an array of dynamic register values at the current step of the computation.
  * `nValues` is an array of dynamic register values at the next step of the computation.
  * `sValues` is an array of secret register values at the current step of the computation.

#### Input descriptor
An `InputDescriptor` object contains information about an [input register](https://github.com/GuildOfWeavers/AirAssembly/tree/master/specs#input-registers) defined for the computation.

`InputDescriptor` has the following properties:

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