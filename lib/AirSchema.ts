// IMPORTS
// ================================================================================================
import { AirSchema as IAirSchema } from "@guildofweavers/air-assembly";
import { FiniteField, createPrimeField } from "@guildofweavers/galois";
import { AirFunction, FunctionContext, Constant, StoreOperation } from "./procedures";
import { Expression, LiteralValue } from "./expressions";
import { Component } from "./Component";

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
    constructor(type: 'prime', modulus: bigint) {
        if (type !== 'prime') throw new Error(`field type '${type}' is not supported`);
        this._field = createPrimeField(modulus);

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
            if (this._handles.has(handle)) {
                throw new Error(`handle ${handle} cannot be declared multiple times`);
            }
            this._handles.add(handle);
        }
        const constant = new Constant(new LiteralValue(value), handle); // TODO: pass field
        this._constants.push(constant);
    }

    // FUNCTIONS
    // --------------------------------------------------------------------------------------------
    get functions(): ReadonlyArray<AirFunction> {
        return this._functions;
    }

    addFunction(context: FunctionContext, statements: StoreOperation[], result: Expression, handle?: string): void {
        if (handle) {
            if (this._handles.has(handle)) {
                throw new Error(`handle ${handle} cannot be declared multiple times`);
            }
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

    addComponent(component: Component): void {
        if (this._components.has(component.name)) {
            throw new Error(`export with name '${component.name}' is declared more than once`);
        }
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
    if (field.extensionDegree === 1) {
        // this is a prime field
        return `(field prime ${field.characteristic})`;
    }
    else {
        throw new Error('non-prime fields are not supported');
    }
}