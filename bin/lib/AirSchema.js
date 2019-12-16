"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const galois_1 = require("@guildofweavers/galois");
const procedures_1 = require("./procedures");
const expressions_1 = require("./expressions");
const Component_1 = require("./Component");
const utils_1 = require("./utils");
// CLASS DEFINITION
// ================================================================================================
class AirSchema {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(fieldType, fieldModulus) {
        utils_1.validate(fieldType === 'prime', errors.invalidFieldType(fieldType));
        this._field = galois_1.createPrimeField(fieldModulus);
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
            utils_1.validate(!this._handles.has(handle), errors.duplicateHandle(handle));
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
    createFunctionContext(params, locals, resultType) {
        const context = new procedures_1.FunctionContext(this, resultType);
        params.forEach(p => context.add(p)); // TODO: move into constructor
        locals.forEach(v => context.add(v)); // TODO: move into constructor
        return context;
    }
    addFunction(context, statements, result, handle) {
        if (handle) {
            utils_1.validate(!this._handles.has(handle), errors.duplicateHandle(handle));
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
    createComponent(name, registers, constraints, steps) {
        return new Component_1.Component(name, this, registers, constraints, steps);
    }
    addComponent(component) {
        utils_1.validate(!this._components.has(component.name), errors.duplicateComponent(component.name));
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
exports.AirSchema = AirSchema;
// HELPER FUNCTIONS
// ================================================================================================
function buildFieldExpression(field) {
    utils_1.validate(field.extensionDegree === 1, 'non-prime fields are not supported');
    return `(field prime ${field.characteristic})`;
}
// ERRORS
// ================================================================================================
const errors = {
    invalidFieldType: (t) => `field type '${t}' is not supported`,
    duplicateHandle: (h) => `handle ${h} cannot be declared multiple times`,
    duplicateComponent: (e) => `export with name '${e}' is declared more than once`
};
//# sourceMappingURL=AirSchema.js.map