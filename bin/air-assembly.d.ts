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
     * Parses and compiles AirAssembly source code into an AirSchema object.
     * @param path Path to the file containing AirAssembly source code.
     * @param limits StarkLimits object against which the schema should be validated.
     */
    export function compile(path: string, limits?: Partial<StarkLimits>): AirSchema;

    /**
     * * Parses and compiles AirAssembly source code into an AirSchema object.
     * @param source Buffer with AirAssembly source code (encoded in UTF8).
     * @param limits StarkLimits object against which the schema should be validated.
     */
    export function compile(source: Buffer, limits?: Partial<StarkLimits>): AirSchema;

    /**
     * Creates an AirModule object from the specified AirSchema.
     * @param schema Schema from which to create the AirModule.
     * @param options Additional options for the AirModule.
     */
    export function instantiate(schema: AirSchema, options?: Partial<AirModuleOptions>): AirModule;

    /** 
     * Performs basic analysis of the specified schema to infer such things as degree of transition
     * constraints, number of additions and multiplications needed to evaluate transition function etc.
     */
    export function analyze(schema: AirSchema): SchemaAnalysisResult;

    // AIR SCHEMA
    // --------------------------------------------------------------------------------------------
    export class AirSchema {

        /** A finite field object instantiated for the field specified for the computation. */
        readonly field: FiniteField;

        /** An array of LiteralValue expressions describing constants defined for the computation. */
        readonly constants: ReadonlyArray<LiteralValue>;

        /** An array of StaticRegister objects describing static registers defined for the computation. */
        readonly staticRegisters: ReadonlyArray<StaticRegister>;

        /** A Procedure object describing transition function expression defined for the computation. */
        readonly transitionFunction: Procedure;

        /** A Procedure object describing transition constraint evaluator expression defined for the computation. */
        readonly constraintEvaluator: Procedure;

        /** An array of `ConstraintDescriptor` objects containing metadata for each of the defined transition constraints. */
        readonly constraints: ConstraintDescriptor[];

        /** An integer value specifying the highest degree of transition constraints defined for the computation. */
        readonly maxConstraintDegree: number;

        /** A map of export declarations, where the key is the name of the export, and the value is an ExportDeclaration object. */
        readonly exports: ReadonlyMap<string, ExportDeclaration>;

        constructor();

        setField(type: 'prime', modulus: bigint): void;
        setConstants(values: LiteralValue[]): void;
        setStaticRegisters(registers: StaticRegisterSet): void;
        setTransitionFunction(span: number, width: number, locals: Dimensions[]): Procedure;
        setConstraintEvaluator(span: number, width: number, locals: Dimensions[]): Procedure;
        setExports(declarations: ExportDeclaration[]): void;

        validateLimits(limits: StarkLimits): void;
    }

    export type ProcedureName = 'transition' | 'evaluation';
    export interface Procedure {
        readonly name           : ProcedureName;
        readonly span           : number;
        readonly locals         : ReadonlyArray<Dimensions>;
        readonly subroutines    : ReadonlyArray<Subroutine>;
        readonly result         : Expression;
        readonly resultLength   : number;

        setResult(expression: Expression): void;
        addSubroutine(expression: Expression, localVarIdx: number): void;
        buildLoadExpression(operation: string, index: number): LoadExpression;
    }

    export interface Subroutine {
        readonly expression     : Expression;
        readonly localVarIdx    : number;
        readonly dimensions     : Dimensions;
    }

    export class ExportDeclaration {
        readonly name           : string;
        readonly cycleLength    : number;
        readonly initializer?   : TraceInitializer;

        readonly isMain         : boolean;

        constructor(name: string, cycleLength: number, initializer?: LiteralValue | 'seed');
    }

    export type TraceInitializer = (field: FiniteField, seed?: bigint[]) => bigint[];

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    export abstract class StaticRegister { }

    export class InputRegister extends StaticRegister {
        readonly secret     : boolean;
        readonly rank       : number;
        readonly binary     : boolean;
        readonly offset     : number;
        readonly parent?    : number;
        readonly steps?     : number;

        private constructor();
    }

    export class CyclicRegister extends StaticRegister {
        
        private constructor();

        getValues(field: FiniteField): bigint[];
    }

    export class PrngValues {
        readonly method : 'sha256';
        readonly seed   : Buffer;
        readonly count  : number;

        constructor(method: string, seed: bigint, count: number);

        getValues(field: FiniteField): bigint[];
    }

    export class MaskRegister extends StaticRegister {
        readonly source     : number;
        readonly inverted   : boolean;

        private constructor();
    }

    export class StaticRegisterSet {
                
        readonly inputs : ReadonlyArray<InputRegister>;
        readonly cyclic : ReadonlyArray<CyclicRegister>;
        readonly masked : ReadonlyArray<MaskRegister>;
        readonly size   : number;

        constructor();

        addInput(scope: string, binary: boolean, typeOrParent: string | number, steps?: number): void;
        addCyclic(values: bigint[]): void;
        addMask(source: number, inverted: boolean): void;

        get(index: number): StaticRegister;
        map<T>(callback: (register: StaticRegister, index: number) => T): T[];
        forEach(callback: (register: StaticRegister, index: number) => void): void;

        getDanglingInputs(): number[];
    }

    // EXPRESSIONS
    // --------------------------------------------------------------------------------------------
    export type Dimensions = [number, number];
    export type Degree = bigint | bigint[] | bigint[][];
    export type StoreTarget = 'local';
    export type LoadSource = 'const' | 'trace' | 'static' | 'local';

    export type BinaryOperationType = 'add' | 'sub' | 'mul' | 'div' | 'exp' | 'prod';
    export type UnaryOperationType = 'neg' | 'inv';

    export abstract class Expression {
        readonly dimensions : Dimensions;
        readonly children   : Expression[];

        constructor(dimensions: Dimensions, children?: Expression[]);

        readonly isScalar   : boolean;
        readonly isVector   : boolean;
        readonly isMatrix   : boolean;

        readonly isStatic   : boolean;
    }

    export class LiteralValue extends Expression {
        readonly value      : bigint | bigint[] | bigint[][];

        constructor(value: bigint | bigint[] | bigint[][]);
    }

    export class BinaryOperation extends Expression {
        readonly operation  : BinaryOperationType;
        readonly lhs        : Expression;
        readonly rhs        : Expression;

        constructor(operation: string, lhs: Expression, rhs: Expression);
    }

    export class UnaryOperation extends Expression {
        readonly operation  : UnaryOperationType;
        readonly operand    : Expression;

        constructor(operation: string, operand: Expression);
    }

    export class MakeVector extends Expression {
        readonly elements   : Expression[];

        constructor(elements: Expression[]);
    }

    export class GetVectorElement extends Expression {
        readonly source     : Expression;
        readonly index      : number;

        constructor(source: Expression, index: number);
    }

    export class SliceVector extends Expression {
        readonly source     : Expression;
        readonly start      : number;
        readonly end        : number;

        constructor(source: Expression, start: number, end: number);
    }

    export class MakeMatrix extends Expression {
        readonly elements   : Expression[][];

        constructor(elements: Expression[][]);
    }

    export class LoadExpression extends Expression {
        readonly source : LoadSource;
        readonly index  : number;
    }

    // ANALYSIS
    // --------------------------------------------------------------------------------------------
    export interface ProcedureAnalysisResult {
        readonly degree     : bigint[];
        readonly operations : {
            readonly add    : number;
            readonly mul    : number;
            readonly inv    : number;
        };
    }

    export interface SchemaAnalysisResult {
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

        /** An array of InputDescriptor objects describing inputs required by the computation. */
        readonly inputDescriptors: InputDescriptor[];

        /** An array of ConstraintDescriptor objects containing metadata for each of the defined transition constraints */
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
         */
        createProver(inputs?: any[]): Prover;

        /**
         * Instantiates a Verifier object for a specific instance of the computation.
         * @param inputShapes Shapes of input registers consumed by the computation. Must be provided
         * only if the computation contains input registers.
         * @param publicInputs Values consumed by input registers. Must be provided only if the
         * computation contains public input registers.
         */
        createVerifier(inputShapes?: InputShape[], publicInputs?: any[]): Verifier;
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
    }

    // CONTEXTS
    // --------------------------------------------------------------------------------------------
    export interface AirInstance {

        /** Reference to the finite field object of the AirModule which describes the computation. */
        readonly field: FiniteField;

        /** Primitive root of unity of the evaluation domain for the instance of the computation. */
        readonly rootOfUnity: bigint;

        /** Length of the execution trace for the instance of the computation. */
        readonly traceLength: number;

        /** Extension factor of the execution trace. */
        readonly extensionFactor: number;

        /** Shapes of all input registers for the instance of the computation. */
        readonly inputShapes: InputShape[];
    }

    export interface Verifier extends AirInstance {
        /**
         * Evaluates transition constraints at the specified point.
         * @param x Point in the evaluation domain at which to evaluate constraints
         * @param rValues Values of trace registers at the current step
         * @param nValues Values of trace registers at the next step
         * @param sValues Values of secret registers at the current step
         */
        evaluateConstraintsAt(x: bigint, rValues: bigint[], nValues: bigint[], sValues: bigint[]): bigint[];
    }

    export interface Prover extends AirInstance {

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
         * @param seed Must be provided only if the seed vector is used in the main export expression.
         */
        generateExecutionTrace(seed?: bigint[]): Matrix;

        /**
         * Evaluates transition constraints for a computation. The evaluations are returned as a matrix
         * object where each row represents a transition constraint evaluated over the composition domain.
         * @param tracePolys A matrix where each row represents a polynomial interpolated from a
         * corresponding register of the execution trace
         */
        evaluateTransitionConstraints(tracePolys: Matrix): Matrix;
    }

    // ERRORS
    // --------------------------------------------------------------------------------------------
    export class AssemblyError {
        readonly errors: any[];
        constructor(errors: any[]);
    }

    // INTERNAL
    // --------------------------------------------------------------------------------------------
    export interface TransitionFunction {
        /**
         * @param r Array with values of trace registers at the current step
         * @param k Array with values of static registers at the current step
         * @returns Array to hold values of trace registers for the next step
         */
        (r: bigint[], k: bigint[]): bigint[];
    }
    
    export interface ConstraintEvaluator {
        /**
         * @param r Array with values of trace registers at the current step
         * @param n Array with values of trace registers at the next step
         * @param k Array with values of static registers at the current step
         * @readonly Array to hold values of constraint evaluated at the current step
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