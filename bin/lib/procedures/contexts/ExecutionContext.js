"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StoreOperation_1 = require("../StoreOperation");
const expressions_1 = require("../../expressions");
const utils_1 = require("../../utils");
// CLASS DEFINITION
// ================================================================================================
class ExecutionContext {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema) {
        this.field = schema.field;
        this.locals = [];
        this.declarationMap = new Map();
        this.constants = schema.constants.map((constant, i) => {
            if (constant.handle) {
                utils_1.validate(!this.declarationMap.has(constant.handle), errors.duplicateHandle(constant.handle));
                this.declarationMap.set(constant.handle, constant);
            }
            this.declarationMap.set(`const::${i}`, constant);
            return constant;
        });
        this.functions = schema.functions.map((func, i) => {
            if (func.handle) {
                utils_1.validate(!this.declarationMap.has(func.handle), errors.duplicateHandle(func.handle));
                this.declarationMap.set(func.handle, func);
            }
            this.declarationMap.set(`func::${i}`, func);
            return func;
        });
    }
    getDeclaration(indexOrHandle, kind) {
        return (typeof indexOrHandle === 'string')
            ? this.declarationMap.get(indexOrHandle)
            : this.declarationMap.get(`${kind}::${indexOrHandle}`);
    }
    buildLiteralValue() {
        // TODO: implement
    }
    buildLoadExpression(operation, indexOrHandle) {
        if (operation === 'load.const') {
            const constant = this.getDeclaration(indexOrHandle, 'const');
            utils_1.validate(constant !== undefined, errors.constNotDeclared(indexOrHandle));
            const index = this.constants.indexOf(constant);
            utils_1.validate(index !== -1, errors.constHandleInvalid(indexOrHandle));
            return new expressions_1.LoadExpression(constant, index);
        }
        else if (operation === 'load.local') {
            const variable = this.getDeclaration(indexOrHandle, 'local');
            utils_1.validate(variable !== undefined, errors.localNotDeclared(indexOrHandle));
            const index = this.locals.indexOf(variable);
            utils_1.validate(index !== -1, errors.localHandleInvalid(indexOrHandle));
            const binding = variable.getBinding(index);
            return new expressions_1.LoadExpression(binding, index);
        }
        else {
            throw new Error(`${operation} operation is not valid in current context`);
        }
    }
    buildStoreOperation(indexOrHandle, value) {
        const variable = this.getDeclaration(indexOrHandle, 'local');
        utils_1.validate(variable !== undefined, errors.localNotDeclared(indexOrHandle));
        const index = this.locals.indexOf(variable);
        utils_1.validate(index !== -1, errors.localHandleInvalid(indexOrHandle));
        const statement = new StoreOperation_1.StoreOperation(index, value);
        variable.bind(statement, index);
        return statement;
    }
    buildCallExpression(indexOrHandle, parameters) {
        const func = this.getDeclaration(indexOrHandle, 'func');
        utils_1.validate(func !== undefined, errors.funcNotDeclared(indexOrHandle));
        const index = this.functions.indexOf(func);
        utils_1.validate(index !== -1, errors.funcHandleInvalid(indexOrHandle));
        return new expressions_1.CallExpression(func, index, parameters);
    }
}
exports.ExecutionContext = ExecutionContext;
// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle: (h) => `handle ${h} cannot be declared multiple times`,
    constNotDeclared: (p) => `cannot load constant ${p}: constant ${p} has not been declared`,
    constHandleInvalid: (p) => `cannot load constant ${p}: handle does not identify a constant`,
    localNotDeclared: (v) => `cannot store into local variable ${v}: local variable ${v} has not been declared`,
    localHandleInvalid: (v) => `cannot store into local variable ${v}: handle does not identify a local variable`,
    funcNotDeclared: (f) => `cannot call function ${f}: function ${f} has not been declared`,
    funcHandleInvalid: (f) => `cannot call function ${f}: handle does not identify a function`
};
//# sourceMappingURL=ExecutionContext.js.map