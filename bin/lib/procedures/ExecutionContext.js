"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Parameter_1 = require("./Parameter");
const LocalVariable_1 = require("./LocalVariable");
const expressions_1 = require("../expressions");
const utils_1 = require("../expressions/utils");
// CLASS DEFINITION
// ================================================================================================
class ExecutionContext {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(groups) {
        this.parameters = [];
        this.locals = [];
        this.declarations = new Map();
        this.groups = new Map();
        groups.forEach(g => this.groups.set(g, []));
    }
    // COLLECTION METHODS
    // --------------------------------------------------------------------------------------------
    add(value) {
        if (value instanceof Parameter_1.Parameter) {
            if (value.handle) {
                this.validateDeclaration('param', value.handle);
                this.declarations.set(`param::${value.handle}`, value);
            }
            this.declarations.set(`param::${this.parameters.length}`, value);
            this.parameters.push(value);
        }
        else if (value instanceof LocalVariable_1.LocalVariable) {
            this.declarations.set(`local::${this.locals.length}`, value);
            this.locals.push(value);
        }
    }
    get(group, indexOrHandle) {
        const result = this.declarations.get(`${group}::${indexOrHandle}`);
        if (!result) {
            // TODO: throw error
        }
        return result;
    }
    has(group, indexOrHandle) {
        return this.declarations.has(`${group}::${indexOrHandle}`);
    }
    toArray(group) {
        return this.groups.get(group);
    }
    // OTHER PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    buildLoadExpression(operation, indexOrHandle) {
        const source = utils_1.getLoadSource(operation);
        if (source === 'local') {
            const variable = this.get(source, indexOrHandle);
            const binding = variable.getBinding(0); // TODO
            return new expressions_1.LoadExpression(binding, this.locals.indexOf(variable));
        }
        // TODO: param source
        else {
            throw new Error(`${operation} is not a valid load operation`);
        }
    }
    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    validateDeclaration(group, handle) {
        if (this.has(group, handle)) {
            if (group === 'param') {
                throw Error(`parameter with handle '${handle}' has already been declared`);
            }
            else if (group === 'local') {
                throw Error(`local variable with handle '${handle}' has already been declared`);
            }
        }
    }
}
exports.ExecutionContext = ExecutionContext;
//# sourceMappingURL=ExecutionContext.js.map