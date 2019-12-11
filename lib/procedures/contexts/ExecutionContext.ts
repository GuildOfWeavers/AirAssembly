// IMPORTS
// ================================================================================================
import { FiniteField } from "@guildofweavers/galois";
import { Constant } from "../Constant";
import { Parameter } from "../Parameter";
import { LocalVariable } from "../LocalVariable";
import { LoadExpression } from "../../expressions";

// CLASS DEFINITION
// ================================================================================================
export abstract class ExecutionContext {

    readonly field          : FiniteField;
    readonly declarationMap : Map<string, Constant | Parameter | LocalVariable>;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(field: FiniteField) {
        this.field = field;
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
}