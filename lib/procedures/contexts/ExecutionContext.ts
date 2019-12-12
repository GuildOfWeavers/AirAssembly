// IMPORTS
// ================================================================================================
import { FiniteField } from "@guildofweavers/galois";
import { AirSchema } from "../../AirSchema";
import { AirFunction } from "../AirFunction";
import { Constant } from "../Constant";
import { Parameter } from "../Parameter";
import { LocalVariable } from "../LocalVariable";
import { StoreOperation } from "../StoreOperation";
import { Expression, LoadExpression } from "../../expressions";
import { validate } from "../../utils";

// CLASS DEFINITION
// ================================================================================================
export abstract class ExecutionContext {

    readonly field          : FiniteField;
    readonly locals         : LocalVariable[];
    readonly constants      : Constant[];
    readonly functions      : AirFunction[];
    readonly declarationMap : Map<string, AirFunction | Constant | Parameter | LocalVariable>;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema: AirSchema) {
        this.field = schema.field;
        this.locals = [];
        this.declarationMap = new Map();

        this.constants = schema.constants.map((constant, i) => {
            if (constant.handle) {
                validate(!this.declarationMap.has(constant.handle), errors.duplicateHandle(constant.handle));
                this.declarationMap.set(constant.handle, constant);
            }
            this.declarationMap.set(`const::${i}`, constant);
            return constant;
        });

        this.functions = schema.functions.map((func, i) => {
            if (func.handle) {
                validate(!this.declarationMap.has(func.handle), errors.duplicateHandle(func.handle));
                this.declarationMap.set(func.handle, func);
            }
            this.declarationMap.set(`func::${i}`, func);
            return func;
        });
    }

    // ABSTRACT FUNCTIONS
    // --------------------------------------------------------------------------------------------
    abstract add(value: Parameter | LocalVariable): void;
    abstract buildLoadExpression(operation: string, indexOrHandle: number | string): LoadExpression;

    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
    getDeclaration(indexOrHandle: number | string, kind: 'const'): Constant | undefined;
    getDeclaration(indexOrHandle: number | string, kind: 'param'): Parameter | undefined;
    getDeclaration(indexOrHandle: number | string, kind: 'local'): LocalVariable | undefined;
    getDeclaration(indexOrHandle: number | string, kind: string): any {
        return (typeof indexOrHandle === 'string')
            ? this.declarationMap.get(indexOrHandle)
            : this.declarationMap.get(`${kind}::${indexOrHandle}`);
    }

    buildLiteralValue() {
        // TODO: implement
    }

    buildStoreOperation(indexOrHandle: number | string, value: Expression): StoreOperation {
        const variable = this.getDeclaration(indexOrHandle, 'local');
        validate(variable !== undefined, errors.localNotDeclared(indexOrHandle));
        const index = this.locals.indexOf(variable);
        validate(index !== -1, errors.localHandleInvalid(indexOrHandle));
        const statement = new StoreOperation(index, value);
        variable.bind(statement, index);
        return statement;
    }

    buildCallExpression() {

    }
}

// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle     : (h: any) => `handle ${h} cannot be declared multiple times`,
    localNotDeclared    : (v: any) => `cannot store into local variable ${v}: local variable ${v} has not been declared`,
    localHandleInvalid  : (v: any) => `cannot store into local variable ${v}: handle does not identify a local variable`
};