"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const galois_1 = require("@guildofweavers/galois");
const procedures_1 = require("./procedures");
const expressions_1 = require("./expressions");
// CLASS DEFINITION
// ================================================================================================
class AirSchema {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(type, modulus) {
        if (type !== 'prime')
            throw new Error(`field type '${type}' is not supported`);
        this._field = galois_1.createPrimeField(modulus);
        this._constants = [];
        this._functions = [];
        this._components = new Map();
        this._handles = new Set();
    }
    // FIELD
    // --------------------------------------------------------------------------------------------
    get field() {
        return this._field;
    }
    // CONSTANTS
    // --------------------------------------------------------------------------------------------
    get constantCount() {
        return this._constants.length;
    }
    get constants() {
        return this._constants;
    }
    addConstant(value, handle) {
        if (handle) {
            if (this._handles.has(handle)) {
                throw new Error(`handle ${handle} cannot be declared multiple times`);
            }
            this._handles.add(handle);
        }
        const constant = new procedures_1.Constant(new expressions_1.LiteralValue(value), handle); // TODO: pass field
        this._constants.push(constant);
    }
    // FUNCTIONS
    // --------------------------------------------------------------------------------------------
    get functions() {
        return this._functions;
    }
    addFunction(context, statements, result, handle) {
        if (handle) {
            if (this._handles.has(handle)) {
                throw new Error(`handle ${handle} cannot be declared multiple times`);
            }
            this._handles.add(handle);
        }
        const func = new procedures_1.AirFunction(context, statements, result, handle);
        this._functions.push(func);
    }
    // EXPORT DECLARATIONS
    // --------------------------------------------------------------------------------------------
    get components() {
        return this._components;
    }
    addComponent(component) {
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
exports.AirSchema = AirSchema;
// HELPER FUNCTIONS
// ================================================================================================
function buildFieldExpression(field) {
    if (field.extensionDegree === 1) {
        // this is a prime field
        return `(field prime ${field.characteristic})`;
    }
    else {
        throw new Error('non-prime fields are not supported');
    }
}
//# sourceMappingURL=AirSchema.js.map