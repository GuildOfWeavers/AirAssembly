// IMPORTS
// ================================================================================================
import { AirSchema as IAirSchema } from "@guildofweavers/air-assembly";
import { FiniteField, createPrimeField } from "@guildofweavers/galois";
import { AirFunction, FunctionContext, Constant, StoreOperation, LocalVariable, Parameter } from "./procedures";
import { Expression, LiteralValue, Dimensions } from "./expressions";
import { Component } from "./Component";
import { validate } from "./utils";

// CLASS DEFINITION
// ================================================================================================
export class AirSchema implements IAirSchema {

    private readonly _field         : FiniteField;
    private readonly _constants     : Constant[];
    private readonly _functions     : AirFunction[];
    private readonly _components    : Map<string, Component>;
    
    private readonly _handles       : Set<string>;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(fieldType: 'prime', fieldModulus: bigint) {
        validate(fieldType === 'prime', errors.invalidFieldType(fieldType));
        this._field = createPrimeField(fieldModulus);

        this._constants = [];
        this._functions = [];
        this._components = new Map();
        this._handles = new Set();
    }

    // FIELD
    // --------------------------------------------------------------------------------------------
    get field(): FiniteField {
        return this._field;
    }

    // CONSTANTS
    // --------------------------------------------------------------------------------------------
    get constantCount(): number {
        return this._constants.length;
    }

    get constants(): ReadonlyArray<Constant> {
        return this._constants;
    }

    addConstant(value: bigint | bigint[] | bigint[][], handle?: string): void {
        if (handle) {
            validate(!this._handles.has(handle), errors.duplicateHandle(handle));
            this._handles.add(handle);
        }
        const constant = new Constant(new LiteralValue(value, this.field), handle);
        this._constants.push(constant);
    }

    // FUNCTIONS
    // --------------------------------------------------------------------------------------------
    get functions(): ReadonlyArray<AirFunction> {
        return this._functions;
    }

    createFunctionContext(resultType: Dimensions): FunctionContext {
        return new FunctionContext(this, resultType);
    }

    addFunction(context: FunctionContext, statements: StoreOperation[], result: Expression, handle?: string): void {
        if (handle) {
            validate(!this._handles.has(handle), errors.duplicateHandle(handle));
            this._handles.add(handle);
        }
        const func = new AirFunction(context, statements, result, handle);
        this._functions.push(func);
    }

    // EXPORT DECLARATIONS
    // --------------------------------------------------------------------------------------------
    get components(): Map<string, Component> {
        return this._components;
    }

    createComponent(name: string, registers: number, constraints: number, steps: number): Component {
        return new Component(name, this, registers, constraints, steps);
    }

    addComponent(component: Component): void {
        validate(!this._components.has(component.name), errors.duplicateComponent(component.name));
        // TODO: validate component structure
        this._components.set(component.name, component);
    }

    // CODE OUTPUT
    // --------------------------------------------------------------------------------------------
    toString() {
        let code = `\n  ${buildFieldExpression(this.field)}`;
        this.constants.forEach(c => code += `\n  ${c.toString()}`);
        this.functions.forEach(f => code += `\n  ${f.toString()}`);
        this.components.forEach(m => code += `\n  ${m.toString()}`);
        return `(module${code}\n)`;
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function buildFieldExpression(field: FiniteField): string {
    validate(field.extensionDegree === 1, 'non-prime fields are not supported');
    return `(field prime ${field.characteristic})`;
}

// ERRORS
// ================================================================================================
const errors = {
    invalidFieldType    : (t: any) => `field type '${t}' is not supported`,
    duplicateHandle     : (h: any) => `handle ${h} cannot be declared multiple times`,
    duplicateComponent  : (e: any) => `export with name '${e}' is declared more than once`
};