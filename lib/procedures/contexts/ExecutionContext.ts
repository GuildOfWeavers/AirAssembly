// IMPORTS
// ================================================================================================
import { FiniteField } from "@guildofweavers/galois";
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
    readonly declarationMap : Map<string, Constant | Parameter | LocalVariable>;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(field: FiniteField) {
        this.field = field;
        this.locals = [];
        this.declarationMap = new Map();
    }

    // ABSTRACT FUNCTIONS
    // --------------------------------------------------------------------------------------------
    abstract add(value: Parameter | LocalVariable): void;
    abstract buildLoadExpression(operation: string, indexOrHandle: number | string): LoadExpression;

    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
    buildLiteralValue() {
        // TODO: implement
    }

    buildStoreOperation(indexOrHandle: number | string, value: Expression): StoreOperation {
        const variable = this.declarationMap.get(`local::${indexOrHandle}`) as LocalVariable;
        validate(variable !== undefined, errors.localNotDeclared(indexOrHandle));
        const index = this.locals.indexOf(variable);
        validate(index !== -1, errors.localHandleInvalid(indexOrHandle));
        const statement = new StoreOperation(index, value);
        variable.bind(statement as any, index); // TODO
        return statement;
    }
}

// ERRORS
// ================================================================================================
const errors = {
    localNotDeclared    : (v: any) => `cannot store into local variable ${v}: local variable ${v} has not been declared`,
    localHandleInvalid  : (v: any) => `cannot store into local variable ${v}: handle does not identify a local variable`
};