"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StoreOperation_1 = require("../StoreOperation");
const utils_1 = require("../../utils");
// CLASS DEFINITION
// ================================================================================================
class ExecutionContext {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(field) {
        this.field = field;
        this.locals = [];
        this.declarationMap = new Map();
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
}
exports.ExecutionContext = ExecutionContext;
// ERRORS
// ================================================================================================
const errors = {
    localNotDeclared: (v) => `cannot store into local variable ${v}: local variable ${v} has not been declared`,
    localHandleInvalid: (v) => `cannot store into local variable ${v}: handle does not identify a local variable`
};
//# sourceMappingURL=ExecutionContext.js.map