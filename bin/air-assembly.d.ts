declare module '@guildofweavers/air-assembly' {

    // IMPORTS AND RE-EXPORTS
    // --------------------------------------------------------------------------------------------
    import { FiniteField, Vector, Matrix, WasmOptions } from '@guildofweavers/galois';
    export { FiniteField, Vector, Matrix, WasmOptions } from '@guildofweavers/galois';

    // INTERFACES
    // --------------------------------------------------------------------------------------------
    export interface ModuleOptions {
        limits?         : Partial<StarkLimits>;
        wasmOptions?    : Partial<WasmOptions> | boolean;
        extensionFactor?: number;
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

    // AIR SCHEMA
    // --------------------------------------------------------------------------------------------
    export class AirSchema {

        readonly field                  : FieldDescriptor;
        readonly constants              : ReadonlyArray<LiteralValue>;
        readonly staticRegisters        : StaticRegisterSet;
        readonly transitionFunction     : Procedure;
        readonly constraintEvaluator    : Procedure;

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
        readonly degree         : ExpressionDegree;
    }

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    export interface StaticRegisterSet {
        readonly inputs : ReadonlyArray<InputRegister>;
        readonly cyclic : ReadonlyArray<CyclicRegister>;

        readonly size   : number;

        addInput(scope: string, binary: boolean, typeOrParent: string | number, steps?: number): void;
        addCyclic(values: bigint[]): void;

        get(index: number): StaticRegister;
    }

    export interface StaticRegister {
        readonly type   : 'input' | 'cyclic';
        readonly index  : number;
        readonly secret : boolean;
    }

    export interface InputRegister extends StaticRegister {
        readonly type   : 'input';
        readonly rank   : number;
        readonly binary : boolean;
        readonly parent?: number;
        readonly steps? : number;
    }

    export interface CyclicRegister extends StaticRegister {
        readonly type   : 'cyclic';
        readonly values : bigint[];        
    }

    export interface StaticRegisterDescriptor {
        readonly type   : 'input' | 'cyclic';
        readonly shape  : number[];
        readonly values : bigint[];
        readonly secret : boolean;
    }

    // EXPRESSIONS
    // --------------------------------------------------------------------------------------------
    export type Dimensions = [number, number];
    export type ExpressionDegree = bigint | bigint[] | bigint[][];
    export type StoreTarget = 'local';
    export type LoadSource = 'const' | 'trace' | 'static' | 'local';

    export abstract class Expression {
        readonly dimensions : Dimensions;
        readonly degree     : ExpressionDegree;
        readonly children   : Expression[];

        constructor(dimensions: Dimensions, degree: ExpressionDegree, children?: Expression[]);

        readonly isScalar   : boolean;
        readonly isVector   : boolean;
        readonly isMatrix   : boolean;

        isSameDimensions(e: Expression): boolean;

        compress(): void;
        collectLoadOperations(source: LoadSource, result: Map<Expression, Expression[]>): void;
        replace(oldExpression: Expression, newExpression: Expression): void;
        updateAccessorIndex(source: LoadSource, fromIdx: number, toIdx: number): void
    }

    export class LiteralValue extends Expression {
        readonly value: bigint | bigint[] | bigint[][];
        constructor(value: bigint | bigint[] | bigint[][]);
    }

    export class BinaryOperation extends Expression {

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
        readonly staticRegisters        : any[];    // TODO
        readonly constraints            : any[];    // TODO
        readonly maxConstraintDegree    : number;

        /**
         * Creates proof object for the provided input values
         * @param inputs values for initializing input registers
         */
        initProof(inputs: any[]): ProofObject;

        /**
         * Creates verification object for the specified trace shape and public inputs
         * @param traceShape number of cycles of each depth of input loop
         * @param publicInputs values for initialize public input registers
         */
        initVerification(traceShape: number[], publicInputs: any[]): VerificationObject;
    }

    export class AirScriptError {
        readonly errors: any[];
        constructor(errors: any[]);
    }

    // CONTEXTS
    // --------------------------------------------------------------------------------------------
    export interface AirObject {
        readonly field              : FiniteField;
        readonly traceShape         : number[];
        readonly traceLength        : number;
        readonly extensionFactor    : number;
        readonly rootOfUnity        : bigint;
        readonly stateWidth         : number;
        readonly constraintCount    : number;
        readonly inputRegisterCount : number;
        readonly staticRegisterCount: number;
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

        /** Values of secret registers evaluated over execution domain */
        readonly secretRegisterTraces: Vector[];

        generateExecutionTrace(): Matrix;
        evaluateTracePolynomials(polynomials: Matrix): Matrix;
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

    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
    export function compile(path: string, limits?: StarkLimits): AirSchema;
    export function compile(source: Buffer, limits?: StarkLimits): AirSchema;

    export function instantiate(path: string, options?: ModuleOptions): Promise<AirModule>;
    export function instantiate(source: Buffer, options?: ModuleOptions): Promise<AirModule>;
}