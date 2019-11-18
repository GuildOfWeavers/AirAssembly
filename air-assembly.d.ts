declare module '@guildofweavers/air-assembly' {

    // IMPORTS AND RE-EXPORTS
    // --------------------------------------------------------------------------------------------
    import { FiniteField, Vector, Matrix, WasmOptions } from '@guildofweavers/galois';
    export { FiniteField, Vector, Matrix, WasmOptions } from '@guildofweavers/galois';

    // COMMON INTERFACES
    // --------------------------------------------------------------------------------------------
    export interface ModuleOptions {
        limits          : Partial<StarkLimits>;
        wasmOptions     : Partial<WasmOptions> | boolean;
        extensionFactor : number;
    }

    export interface StarkLimits {

        /** Maximum number of steps in an execution trace; defaults to 2^20 */
        maxTraceLength: number;

        /** Maximum number of state registers; defaults to 64 */
        maxTraceRegisters: number;

        /** Maximum number of all static registers; defaults to 64 */
        maxStaticRegisters: number;

        /** Maximum number of transition constraints; defaults to 1024 */
        maxConstraintCount: number;

        /** Highest allowed degree of transition constraints; defaults to 16 */
        maxConstraintDegree: number;
    }

    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
    export function compile(path: string, limits?: Partial<StarkLimits>): AirSchema;
    export function compile(source: Buffer, limits?: Partial<StarkLimits>): AirSchema;

    export function analyze(schema: AirSchema): any;

    export function instantiate(schema: AirSchema, options?: Partial<ModuleOptions>): AirModule;

    // AIR SCHEMA
    // --------------------------------------------------------------------------------------------
    export class AirSchema {

        readonly field                  : FieldDescriptor;
        readonly constants              : ReadonlyArray<LiteralValue>;
        readonly staticRegisters        : ReadonlyArray<StaticRegister>;
        readonly transitionFunction     : Procedure;
        readonly constraintEvaluator    : Procedure;
        readonly constraints            : ConstraintDescriptor[];
        readonly maxConstraintDegree    : number;

        setField(type: 'prime', modulus: bigint): void;
        setConstants(values: LiteralValue[]): void;
        setStaticRegisters(registers: StaticRegisterSet): void;
        setTransitionFunction(span: number, width: number, locals: Dimensions[]): Procedure;
        setConstraintEvaluator(span: number, width: number, locals: Dimensions[]): Procedure;

        validateLimits(limits: StarkLimits): void;
    }

    export interface FieldDescriptor {
        readonly type       : 'prime';
        readonly modulus    : bigint;
    }

    export type ProcedureName = 'transition' | 'evaluation';
    export interface Procedure {
        readonly name           : ProcedureName;
        readonly span           : number;
        readonly locals         : ReadonlyArray<Dimensions>;
        readonly subroutines    : ReadonlyArray<Subroutine>;
        readonly expressions    : ReadonlyArray<Expression>;
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

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    export abstract class StaticRegister { }

    export class InputRegister extends StaticRegister {
        readonly secret : boolean;
        readonly rank   : number;
        readonly binary : boolean;
        readonly parent?: number;
        readonly steps? : number;
    }

    export class CyclicRegister extends StaticRegister {
        readonly values : bigint[];        
    }

    export class MaskRegister extends StaticRegister {
        readonly source : number;
        readonly value  : bigint;
    }

    export interface StaticRegisterSet {
               
        readonly size   : number;
        readonly inputs : ReadonlyArray<InputRegister>;
        readonly cyclic : ReadonlyArray<CyclicRegister>;
        readonly masked : ReadonlyArray<MaskRegister>;

        addInput(scope: string, binary: boolean, typeOrParent: string | number, steps?: number): void;
        addCyclic(values: bigint[]): void;
        addMask(source: number, value: bigint): void;

        get(index: number): StaticRegister;
        map<T>(callback: (register: StaticRegister, index: number) => T): T[];
        forEach(callback: (register: StaticRegister, index: number) => void): void;
    }

    // EXPRESSIONS
    // --------------------------------------------------------------------------------------------
    export type Dimensions = [number, number];
    export type ExpressionDegree = bigint | bigint[] | bigint[][];
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

        isSameDimensions(e: Expression): boolean;
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

    // AIR MODULE
    // --------------------------------------------------------------------------------------------
    export interface AirModule {

        readonly field                  : FiniteField;
        readonly traceRegisterCount     : number;
        readonly staticRegisterCount    : number;
        readonly inputDescriptors       : InputDescriptor[];
        readonly constraints            : ConstraintDescriptor[];
        readonly maxConstraintDegree    : number;
        readonly extensionFactor        : number;

        /**
         * Creates proof object for the provided input values
         * @param inputs values for initializing input registers
         */
        initProof(inputs: any[]): ProofObject;

        /**
         * Creates verification object for the specified input shapes and public inputs
         * @param inputShapes 
         * @param publicInputs values for initialize public input registers
         */
        initVerification(inputShapes: InputShape[], publicInputs: any[]): VerificationObject;
    }

    export interface InputDescriptor {
        readonly rank       : number;
        readonly secret     : boolean;
        readonly binary     : boolean;
        readonly parent?    : number;
        readonly steps?     : number;
    }

    export type InputShape = number[];

    export interface ConstraintDescriptor {
        readonly degree     : number;
    }

    // CONTEXTS
    // --------------------------------------------------------------------------------------------
    export interface AirObject {
        readonly field              : FiniteField;
        readonly rootOfUnity        : bigint;
        readonly traceLength        : number;
        readonly extensionFactor    : number;
        readonly inputShapes        : InputShape[];
    }

    export interface VerificationObject extends AirObject {
        /**
         * Evaluates transition constraints at the specified point
         * @param x Point in the evaluation domain at which to evaluate constraints
         * @param rValues Values of mutable registers at the current step
         * @param nValues Values of mutable registers at the next step
         * @param hValues Values of hidden registers at the current step
         */
        evaluateConstraintsAt(x: bigint, rValues: bigint[], nValues: bigint[], hValues: bigint[]): bigint[];
    }

    export interface ProofObject extends AirObject {
        /** Domain of the execution trace */
        readonly executionDomain: Vector;

        /** Domain of the low-degree extended execution trace */
        readonly evaluationDomain: Vector;

        /** Domain of the low-degree extended composition polynomial */
        readonly compositionDomain: Vector;

        /** Values of secret registers evaluated over evaluation domain */
        readonly secretRegisterTraces: Vector[];

        generateExecutionTrace(): Matrix;
        evaluateTracePolynomials(polynomials: Matrix): Matrix;
    }

    // ERRORS
    // --------------------------------------------------------------------------------------------
    export class AirScriptError {
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

    export type StaticRegisterType = 'input' | 'cyclic' | 'mask';
    export interface RegisterEvaluatorSpecs {
        readonly type   : StaticRegisterType;
        readonly shape? : number[];
        readonly values : bigint[];
        readonly secret : boolean;
    }

    export interface MaskRegisterDescriptor {
        source  : number;
        value   : bigint;
    }
}