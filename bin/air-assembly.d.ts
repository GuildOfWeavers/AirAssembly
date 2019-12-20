declare module '@guildofweavers/air-assembly' {

    // IMPORTS AND RE-EXPORTS
    // --------------------------------------------------------------------------------------------
    import { FiniteField, Vector, Matrix, WasmOptions } from '@guildofweavers/galois';
    export { FiniteField, Vector, Matrix, WasmOptions } from '@guildofweavers/galois';

    // COMMON INTERFACES
    // --------------------------------------------------------------------------------------------
    export interface StarkLimits {

        /** Maximum number of steps in an execution trace; defaults to 2^20 */
        maxTraceLength: number;

        /** Maximum number of state registers; defaults to 64 */
        maxTraceRegisters: number;

        /** Maximum number of static registers; defaults to 64 */
        maxStaticRegisters: number;

        /** Maximum number of transition constraints; defaults to 1024 */
        maxConstraintCount: number;

        /** Highest allowed degree of transition constraints; defaults to 16 */
        maxConstraintDegree: number;
    }

    export interface AirModuleOptions {
        /** Limits to be imposed on the instantiated module. */
        limits: Partial<StarkLimits>;

        /** 
         * Options for finite fields which can take advantage of WebAssembly optimization. Can also
         * be set to a boolean value to turn the optimization on or off
         */
        wasmOptions: Partial<WasmOptions> | boolean;

        /**
         * Number by which the execution trace is to be "stretched." Must be a power of 2 at least
         * 2x of the highest constraint degree. This property is optional, the default is the
         * smallest power of 2 that is greater than 2x of the highest constraint degree.
         */
        extensionFactor: number;
    }

    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------

    /**
     * Parses and compiles AirAssembly source code into an AirSchema object
     * @param path Path to the file containing AirAssembly source code
     * @param limits StarkLimits object against which the schema should be validated
     */
    export function compile(path: string, limits?: Partial<StarkLimits>): AirSchema;

    /**
     * * Parses and compiles AirAssembly source code into an AirSchema object
     * @param source Buffer with AirAssembly source code (encoded in UTF8)
     * @param limits StarkLimits object against which the schema should be validated
     */
    export function compile(source: Buffer, limits?: Partial<StarkLimits>): AirSchema;

    /**
     * Creates an AirModule object for the defaulted schema component
     * @param schema Schema containing the component to instantiate
     * @param options Additional options for the AirModule
     */
    export function instantiate(schema: AirSchema, options?: Partial<AirModuleOptions>): AirModule;

    /**
     * Creates an AirModule object for the specified schema component
     * @param schema Schema containing the component to instantiate
     * @param component Name of the component to instantiate
     * @param options Additional options for the AirModule
     */
    export function instantiate(schema: AirSchema, component: string, options?: Partial<AirModuleOptions>): AirModule;

    /** 
     * Performs basic analysis of the specified schema to infer such things as degree of transition
     * constraints, number of additions and multiplications needed to evaluate transition function etc.
     * @param schema Schema containing the component to analyze
     * @param component Name of the component to analyze
     */
    export function analyze(schema: AirSchema, component: string): ComponentAnalysisResult;

    // AIR SCHEMA
    // --------------------------------------------------------------------------------------------
    export class AirSchema {

        /** A finite field defined for the module */
        readonly field: FiniteField;

        /** Constants defined for the module */
        readonly constants: ReadonlyArray<Constant>;

        /** Functions defined for the module */
        readonly functions: ReadonlyArray<AirFunction>;

        /** Components defined for the module exposed as a map keyed by component name */
        readonly components: ReadonlyMap<string, AirComponent>;

        /**
         * Creates a new AirSchema object
         * @param fieldType Type of the finite field
         * @param fieldModulus Modules of the prime filed
         */
        constructor(fieldType: 'prime', fieldModulus: bigint);

        /**
         * Adds a constant to the module
         * @param value Value of the constant
         * @param handle Optional constant handle
         */
        addConstant(value: bigint | bigint[] | bigint[][], handle?: string): void;

        /**
         * Creates a new function context from the current state of the schema
         * @param resultType Dimensions of the expected function return value
         * @param handle Optional function handle
         */
        createFunctionContext(resultType: Dimensions, handle?: string): FunctionContext;

        /**
         * Adds a function to the module
         * @param context Function context, including parameters and local variables
         * @param statements A list of store operations within the function body
         * @param result The return expression of the function
         */
        addFunction(context: FunctionContext, statements: StoreOperation[], result: Expression): void;

        /**
         * Creates a component for a new computation within the module
         * @param name Name of the component
         * @param registers Number of dynamic registers expected in the computation
         * @param constraints Number of constraints expected in the computation
         * @param steps Minimal cycle length possible for the computation
         */
        createComponent(name: string, registers: number, constraints: number, steps: number): AirComponent;

        /**
         * Adds a component to the module
         * @param component Component to add to the module
         */
        addComponent(component: AirComponent): void;
    }

    export interface AirComponent {

        /** Name of the computation */
        readonly name: string;

        /** Static registers defined for the computation */
        readonly staticRegisters: ReadonlyArray<StaticRegister>;

        /** Number of secret input registers defined for the computation */
        readonly secretInputCount: number;

        /** Trace initialization procedure defined for the computation */
        readonly traceInitializer: AirProcedure;

        /** Transition function procedure defined for the computation */
        readonly transitionFunction: AirProcedure;

        /** Transition constraint evaluator procedure defined for the computation. */
        readonly constraintEvaluator: AirProcedure;

        /** Transition constraint properties */
        readonly constraints: ConstraintDescriptor[];

        /** Highest degree of transition constraints defined for the computation. */
        readonly maxConstraintDegree: number;

        addInputRegister(scope: string, binary: boolean, parentIdx?: number, steps?: number, offset?: number): void;
        addMaskRegister(sourceIdx: number, inverted: boolean): void;
        addCyclicRegister(values: bigint[] | PrngSequence): void;
        
        /**
         * Creates a new procedure context from the current state of the component
         * @param name Name of the procedure
         */
        createProcedureContext(name: ProcedureName): ProcedureContext;

        setTraceInitializer(context: ProcedureContext, statements: StoreOperation[], result: Expression): void;
        setTransitionFunction(context: ProcedureContext, statements: StoreOperation[], result: Expression): void;
        setConstraintEvaluator(context: ProcedureContext, statements: StoreOperation[], result: Expression): void;
    }

    // FUNCTIONS AND PROCEDURES
    // --------------------------------------------------------------------------------------------
    export interface AirFunction {
        readonly handle?        : string;
        readonly params         : ReadonlyArray<Parameter>;
        readonly locals         : ReadonlyArray<LocalVariable>;
        readonly statements     : ReadonlyArray<StoreOperation>;
        readonly result         : Expression;
    }

    export type ProcedureName = 'init' | 'transition' | 'evaluation';
    export interface AirProcedure {
        readonly name           : ProcedureName;
        readonly params         : ReadonlyArray<Parameter>
        readonly locals         : ReadonlyArray<LocalVariable>;
        readonly statements     : ReadonlyArray<StoreOperation>;
        readonly result         : Expression;
    }

    export interface Constant {
        readonly dimensions : Dimensions;
        readonly value      : LiteralValue;
        readonly handle?    : string;
    }

    export interface Parameter {
        readonly dimensions : Dimensions;
        readonly handle?    : string;
    }

    export interface LocalVariable {
        readonly dimensions : Dimensions;
        readonly handle?    : string;
    }

    export interface StoreOperation {
        readonly expression     : Expression;
        readonly target         : number;
        readonly dimensions     : Dimensions;
    }

    export interface ExecutionContext {
        readonly field          : FiniteField;
        readonly constants      : ReadonlyArray<Constant>;
        readonly functions      : ReadonlyArray<AirFunction>;
        readonly params         : ReadonlyArray<Parameter>;
        readonly locals         : ReadonlyArray<LocalVariable>;

        addParam(dimensions: Dimensions, handle?: string): void;
        addLocal(dimensions: Dimensions, handle?: string): void;

        buildLiteralValue(value: bigint | bigint[] | bigint[]): LiteralValue;
        buildBinaryOperation(operation: string, lhs: Expression, rhs: Expression): BinaryOperation;
        buildUnaryOperation(operation: string, operand: Expression): UnaryOperation;
        buildMakeVectorExpression(elements: Expression[]): MakeVector;
        buildGetVectorElementExpression(source: Expression, index: number): GetVectorElement;
        buildSliceVectorExpression(source: Expression, start: number, end: number): SliceVector;
        buildMakeMatrixExpression(elements: Expression[][]): MakeMatrix;
        buildLoadExpression(operation: string, indexOrHandle: number | string): LoadExpression;
        buildStoreOperation(indexOrHandle: number | string, value: Expression): StoreOperation;
        buildCallExpression(indexOrHandle: number | string, params: Expression[]): CallExpression;
    }

    export interface FunctionContext extends ExecutionContext{        
        readonly result         : Dimensions;
    }

    export interface ProcedureContext extends ExecutionContext {
        readonly name           : ProcedureName;
        readonly traceRegisters : any;
        readonly staticRegisters: any;
        readonly width          : number;
    }

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    export interface StaticRegister {}

    export interface InputRegister extends StaticRegister {
        readonly secret     : boolean;
        readonly rank       : number;
        readonly binary     : boolean;
        readonly offset     : number;
        readonly parent?    : number;
        readonly steps?     : number;
    }

    export interface MaskRegister extends StaticRegister {
        readonly source     : number;
        readonly inverted   : boolean;
    }

    export interface CyclicRegister extends StaticRegister {
        readonly cycleLength: number;

        getValues(): bigint[];
    }

    export class PrngSequence {
        readonly method : 'sha256';
        readonly seed   : Buffer;
        readonly length : number;

        constructor(method: string, seed: bigint, count: number);

        getValues(field: FiniteField): bigint[];
    }

    // EXPRESSIONS
    // --------------------------------------------------------------------------------------------
    export type Dimensions = [number, number];
    export type Degree = bigint | bigint[] | bigint[][];
    export type LoadSource = 'const' | 'trace' | 'static' | 'param' | 'local';  // TODO: rename?

    export type BinaryOperationType = 'add' | 'sub' | 'mul' | 'div' | 'exp' | 'prod';
    export type UnaryOperationType = 'neg' | 'inv';

    export interface Expression {
        readonly dimensions : Dimensions;
        readonly children   : Expression[];

        readonly isScalar   : boolean;
        readonly isVector   : boolean;
        readonly isMatrix   : boolean;

        readonly isStatic   : boolean;
    }

    export interface LiteralValue extends Expression {
        readonly value      : bigint | bigint[] | bigint[][];
    }

    export interface BinaryOperation extends Expression {
        readonly operation  : BinaryOperationType;
        readonly lhs        : Expression;
        readonly rhs        : Expression;
    }

    export interface UnaryOperation extends Expression {
        readonly operation  : UnaryOperationType;
        readonly operand    : Expression;
    }

    export interface MakeVector extends Expression {
        readonly elements   : Expression[];
    }

    export interface GetVectorElement extends Expression {
        readonly source     : Expression;
        readonly index      : number;
    }

    export interface SliceVector extends Expression {
        readonly source     : Expression;
        readonly start      : number;
        readonly end        : number;
    }

    export interface MakeMatrix extends Expression {
        readonly elements   : Expression[][];
    }

    export interface LoadExpression extends Expression {
        readonly source     : LoadSource;
        readonly index      : number;
    }

    export interface CallExpression extends Expression {
        readonly func       : AirFunction;
        readonly index      : number;
        readonly params     : Expression[];
    }

    // ANALYSIS
    // --------------------------------------------------------------------------------------------
    export interface ProcedureAnalysisResult {
        readonly results: {
            readonly degree     : bigint;
            readonly traceRefs  : number[];
            readonly staticRefs : number[];
        }[];
        readonly operations : {
            readonly add        : number;
            readonly mul        : number;
            readonly inv        : number;
        };
    }

    export interface ComponentAnalysisResult {
        readonly transition : ProcedureAnalysisResult;
        readonly evaluation : ProcedureAnalysisResult;
    }

    // AIR MODULE
    // --------------------------------------------------------------------------------------------
    export interface AirModule {

        /** A finite field object used for all arithmetic operations of the computation. */
        readonly field: FiniteField;

        /** Number of state registers in the execution trace. */
        readonly traceRegisterCount: number;

        /** Number of static registers in the execution trace. */
        readonly staticRegisterCount: number;

        /** An array of input descriptors with metadata for inputs required by the computation. */
        readonly inputDescriptors: InputDescriptor[];

        /** Number of secret input registers defined for the computation */
        readonly secretInputCount: number;

        /** An array of constraint descriptors with metadata for the defined transition constraints */
        readonly constraints: ConstraintDescriptor[];

        /** The highest degree of transition constraints defined for the computation. */
        readonly maxConstraintDegree: number;

        /** An integer value specifying how much the execution trace is to be "stretched." */
        readonly extensionFactor: number;

        /**
         * Instantiates a Prover object for a specific instance of the computation.
         * @param inputs Values for initializing input registers. Must be provided only if the
         * computation contains input registers. In such a case, the shape of input objects must
         * be in line with the shapes specified by the computation's input descriptors.
         * @param seed Must be provided only if the seed vector is used in the main export expression.
         */
        initProvingContext(inputs?: any[], seed?: bigint[]): ProvingContext;

        /**
         * Instantiates a Verifier object for a specific instance of the computation.
         * @param inputShapes Shapes of input registers consumed by the computation. Must be provided
         * only if the computation contains input registers.
         * @param publicInputs Values consumed by input registers. Must be provided only if the
         * computation contains public input registers.
         */
        initVerificationContext(inputShapes?: InputShape[], publicInputs?: any[]): VerificationContext;
    }

    export interface InputDescriptor {
        /** An integer value indicating the position of the register in the input dependency tree. */
        readonly rank: number;

        /** A boolean value indicating wither the inputs for the register are public or secret. */
        readonly secret: boolean;

        /** A boolean value indicating whether the register can accept only binary values (ones and zeros). */
        readonly binary: boolean;

        /**
         * A signed integer value specifying the number of steps by which an input value is to be
         * shifted in the execution trace.
         */
        readonly offset: number;

        /**
         * An integer value specifying an index of the parent input register. If the register has
         * no parents, this property will be undefined.
         */
        readonly parent?: number;

        /** 
         * An integer value specifying the number of steps by which a register trace is to be
         * expanded for each input value. For non-leaf registers, this property will be undefined.
         */
        readonly steps?: number;
    }

    /**
     * Describes shape of an input register. Each value in the array corresponds to the number of
     * input values provided at that level of the input hierarchy.
     */
    export type InputShape = number[];

    export interface ConstraintDescriptor {
        readonly degree     : number;
        readonly traceRefs  : number[];
        readonly staticRefs : number[];
    }

    // CONTEXTS
    // --------------------------------------------------------------------------------------------
    export interface AirContext {

        /** Reference to the finite field object of the AirModule which describes the computation. */
        readonly field: FiniteField;

        /** Primitive root of unity of the evaluation domain for the instance of the computation. */
        readonly rootOfUnity: bigint;

        /** Length of the execution trace for the instance of the computation. */
        readonly traceLength: number;

        /** Extension factor of the execution trace. */
        readonly extensionFactor: number;

        /** An array of constraint descriptors with metadata for the defined transition constraints */
        readonly constraints: ConstraintDescriptor[];

        /** Shapes of all input registers for the instance of the computation. */
        readonly inputShapes: InputShape[];
    }

    export interface VerificationContext extends AirContext {
        /**
         * Evaluates transition constraints at the specified point.
         * @param x Point in the evaluation domain at which to evaluate constraints
         * @param rValues Values of trace registers at the current step
         * @param nValues Values of trace registers at the next step
         * @param sValues Values of secret registers at the current step
         */
        evaluateConstraintsAt(x: bigint, rValues: bigint[], nValues: bigint[], sValues: bigint[]): bigint[];
    }

    export interface ProvingContext extends AirContext {

        /** Domain of the execution trace */
        readonly executionDomain: Vector;

        /** Domain of the low-degree extended execution trace */
        readonly evaluationDomain: Vector;

        /** Domain of the low-degree extended composition polynomial */
        readonly compositionDomain: Vector;

        /** Values of secret registers evaluated over evaluation domain */
        readonly secretRegisterTraces: Vector[];

        /**
         * Generates execution trace for the computation. The trace is returned as a Matrix object where
         * rows correspond to the dynamic register traces, and columns correspond to computation steps.
         */
        generateExecutionTrace(): Matrix;

        /**
         * Evaluates transition constraints for a computation. The evaluations are returned as a matrix
         * object where each row represents a transition constraint evaluated over the composition domain.
         * @param tracePolys A matrix where each row represents a polynomial interpolated from a
         * corresponding register of the execution trace
         */
        evaluateTransitionConstraints(tracePolys: Matrix): Matrix;
    }

    // PRNG
    // --------------------------------------------------------------------------------------------
    export type PrngFunction = (seed: Buffer, count: number, field: FiniteField) => bigint[];
    export const prng: {
        sha256: PrngFunction;
    };

    // ERRORS
    // --------------------------------------------------------------------------------------------
    export class AssemblyError {
        readonly errors: any[];
        constructor(errors: any[]);
    }

    // INTERNAL
    // --------------------------------------------------------------------------------------------
    export interface TraceInitializer {
        /**
         * @param k Array with values of static registers at last step
         * @param p0 Vector with trace seed values
         * @returns Array with values of execution trace at step 0
         */
        (k: bigint[], p0: Vector): bigint[];
    }

    export interface TransitionFunction {
        /**
         * @param r Array with values of trace registers at the current step
         * @param k Array with values of static registers at the current step
         * @returns Array with values of trace registers for the next step
         */
        (r: bigint[], k: bigint[]): bigint[];
    }
    
    export interface ConstraintEvaluator {
        /**
         * @param r Array with values of trace registers at the current step
         * @param n Array with values of trace registers at the next step
         * @param k Array with values of static registers at the current step
         * @returns Array with values of constraint evaluated at the current step
         */
        (r: bigint[], n: bigint[], k: bigint[]): bigint[];
    }

    export interface RegisterEvaluatorSpecs {
        readonly values     : bigint[];
        readonly cyclic     : boolean;
        readonly secret?    : boolean;
        readonly invert?    : boolean;
        readonly rotate?    : number;
    }

    export interface MaskRegisterDescriptor {
        readonly source     : number;
        readonly inverted   : boolean;
    }
}