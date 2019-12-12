"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StoreOperation_1 = require("../StoreOperation");
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
    buildStoreOperation(indexOrHandle, value) {
        const variable = this.getDeclaration(indexOrHandle, 'local');
        utils_1.validate(variable !== undefined, errors.localNotDeclared(indexOrHandle));
        const index = this.locals.indexOf(variable);
        utils_1.validate(index !== -1, errors.localHandleInvalid(indexOrHandle));
        const statement = new StoreOperation_1.StoreOperation(index, value);
        variable.bind(statement, index);
        return statement;
    }
    buildCallExpression() {
    }
}
exports.ExecutionContext = ExecutionContext;
// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle: (h) => `handle ${h} cannot be declared multiple times`,
    localNotDeclared: (v) => `cannot store into local variable ${v}: local variable ${v} has not been declared`,
    localHandleInvalid: (v) => `cannot store into local variable ${v}: handle does not identify a local variable`
};
//# sourceMappingURL=ExecutionContext.js.map