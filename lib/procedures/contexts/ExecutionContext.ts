// IMPORTS
// ================================================================================================
import { ExecutionContext as IExecutionContext } from '@guildofweavers/air-assembly';
import { FiniteField } from "@guildofweavers/galois";
import { AirFunction } from "../AirFunction";
import { Constant } from "../Constant";
import { Parameter } from "../Parameter";
import { LocalVariable } from "../LocalVariable";
import { StoreOperation } from "../StoreOperation";
import {
    Expression, LiteralValue, Dimensions, BinaryOperation, UnaryOperation, MakeVector, GetVectorElement,
    SliceVector, MakeMatrix, LoadExpression, CallExpression
} from "../../expressions";
import { validate } from "../../utils";

// CLASS DEFINITION
// ================================================================================================
export abstract class ExecutionContext implements IExecutionContext {

    readonly field          : FiniteField;
    readonly params         : Parameter[];
    readonly locals         : LocalVariable[];
    readonly constants      : ReadonlyArray<Constant>;
    readonly functions      : ReadonlyArray<AirFunction>;
    readonly declarationMap : Map<string, AirFunction | Constant | Parameter | LocalVariable>;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(field: FiniteField, constants: ReadonlyArray<Constant>, functions: ReadonlyArray<AirFunction>) {
        this.field = field;
        this.params = [];
        this.locals = [];
        this.declarationMap = new Map();

        this.constants = constants.map((constant, i) => {
            if (constant.handle) {
                validate(!this.declarationMap.has(constant.handle), errors.duplicateHandle(constant.handle));
                this.declarationMap.set(constant.handle, constant);
            }
            this.declarationMap.set(`const::${i}`, constant);
            return constant;
        });

        this.functions = functions.map((func, i) => {
            if (func.handle) {
                validate(!this.declarationMap.has(func.handle), errors.duplicateHandle(func.handle));
                this.declarationMap.set(func.handle, func);
            }
            this.declarationMap.set(`func::${i}`, func);
            return func;
        });
    }

    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
    addParam(dimensions: Dimensions, handle?: string): void {
        const param = new Parameter(dimensions, handle);

        // if the parameter has a handle, set handle mapping
        if (handle) {
            validate(!this.declarationMap.has(handle), errors.duplicateHandle(handle));
            this.declarationMap.set(handle, param);
        }

        // set index mapping and add parameter to the list
        this.declarationMap.set(`param::${this.params.length}`, param);
        this.params.push(param);
    }

    addLocal(dimensions: Dimensions, handle?: string): void {
        const variable = new LocalVariable(dimensions, handle);

        // if the variable has a handle, set handle mapping
        if (handle) {
            validate(!this.declarationMap.has(handle), errors.duplicateHandle(handle));
            this.declarationMap.set(handle, variable);
        }

        // set index mapping and add local variable to the list
        this.declarationMap.set(`local::${this.locals.length}`, variable);
        this.locals.push(variable);
    }

    getDeclaration(indexOrHandle: number | string, kind: 'const'): Constant | undefined;
    getDeclaration(indexOrHandle: number | string, kind: 'param'): Parameter | undefined;
    getDeclaration(indexOrHandle: number | string, kind: 'local'): LocalVariable | undefined;
    getDeclaration(indexOrHandle: number | string, kind: 'func'): AirFunction | undefined;
    getDeclaration(indexOrHandle: number | string, kind: string): any {
        return (typeof indexOrHandle === 'string')
            ? this.declarationMap.get(indexOrHandle)
            : this.declarationMap.get(`${kind}::${indexOrHandle}`);
    }

    // EXPRESSION BUILDERS
    // --------------------------------------------------------------------------------------------
    buildLiteralValue(value: bigint | bigint[] | bigint[][]): LiteralValue {
        return new LiteralValue(value, this.field);
    }

    buildBinaryOperation(operation: string, lhs: Expression, rhs: Expression): BinaryOperation {
        return new BinaryOperation(operation, lhs, rhs);
    }

    buildUnaryOperation(operation: string, operand: Expression): UnaryOperation {
        return new UnaryOperation(operation, operand);
    }

    buildMakeVectorExpression(elements: Expression[]): MakeVector {
        return new MakeVector(elements);
    }

    buildGetVectorElementExpression(source: Expression, index: number): GetVectorElement {
        return new GetVectorElement(source, index);
    }

    buildSliceVectorExpression(source: Expression, start: number, end: number): SliceVector {
        return new SliceVector(source, start, end);
    }

    buildMakeMatrixExpression(elements: Expression[][]): MakeMatrix {
        return new MakeMatrix(elements);
    }

    buildLoadExpression(operation: string, indexOrHandle: number | string): LoadExpression {
        if (operation === 'load.param') {
            const parameter = this.getDeclaration(indexOrHandle, 'param');
            validate(parameter !== undefined, errors.paramNotDeclared(indexOrHandle));
            const index = this.params.indexOf(parameter);
            validate(index !== -1, errors.paramHandleInvalid(indexOrHandle));
            return new LoadExpression(parameter, index);
        }
        else if (operation === 'load.const') {
            const constant = this.getDeclaration(indexOrHandle, 'const');
            validate(constant !== undefined, errors.constNotDeclared(indexOrHandle));
            const index = this.constants.indexOf(constant);
            validate(index !== -1, errors.constHandleInvalid(indexOrHandle));
            return new LoadExpression(constant, index);
        }
        else if (operation === 'load.local') {
            const variable = this.getDeclaration(indexOrHandle, 'local');
            validate(variable !== undefined, errors.localNotDeclared(indexOrHandle));
            const index = this.locals.indexOf(variable);
            validate(index !== -1, errors.localHandleInvalid(indexOrHandle));
            const binding = variable.getBinding(index);
            return new LoadExpression(binding, index);
        }
        else {
            throw new Error(`${operation} operation is not valid in current context`);
        }
    }

    buildStoreOperation(indexOrHandle: number | string, value: Expression): StoreOperation {
        const variable = this.getDeclaration(indexOrHandle, 'local');
        validate(variable !== undefined, errors.localNotDeclared(indexOrHandle));
        const index = this.locals.indexOf(variable);
        validate(index !== -1, errors.localHandleInvalid(indexOrHandle));
        const handle = typeof indexOrHandle === 'string' ? indexOrHandle : undefined;
        const statement = new StoreOperation(index, value, handle);
        variable.bind(statement, index);
        return statement;
    }

    buildCallExpression(indexOrHandle: number | string, params: Expression[]): CallExpression {
        const func = this.getDeclaration(indexOrHandle, 'func');
        validate(func !== undefined, errors.funcNotDeclared(indexOrHandle));
        const index = this.functions.indexOf(func);
        validate(index !== -1, errors.funcHandleInvalid(indexOrHandle));
        return new CallExpression(func, index, params);
    }
}

// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle     : (h: any) => `handle ${h} cannot be declared multiple times`,
    constNotDeclared    : (p: any) => `cannot load constant ${p}: constant ${p} has not been declared`,
    constHandleInvalid  : (p: any) => `cannot load constant ${p}: handle does not identify a constant`,
    paramNotDeclared    : (p: any) => `cannot load parameter ${p}: parameter ${p} has not been declared`,
    paramHandleInvalid  : (p: any) => `cannot load parameter ${p}: handle does not identify a parameter`,
    localNotDeclared    : (v: any) => `cannot store into local variable ${v}: local variable ${v} has not been declared`,
    localHandleInvalid  : (v: any) => `cannot store into local variable ${v}: handle does not identify a local variable`,
    funcNotDeclared     : (f: any) => `cannot call function ${f}: function ${f} has not been declared`,
    funcHandleInvalid   : (f: any) => `cannot call function ${f}: handle does not identify a function`
};