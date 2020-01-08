"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Parameter_1 = require("../Parameter");
const LocalVariable_1 = require("../LocalVariable");
const StoreOperation_1 = require("../StoreOperation");
const expressions_1 = require("../../expressions");
const utils_1 = require("../../utils");
// CLASS DEFINITION
// ================================================================================================
class ExecutionContext {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(field, constants, functions) {
        this.field = field;
        this.params = [];
        this.locals = [];
        this.declarationMap = new Map();
        this.constants = constants.map((constant, i) => {
            if (constant.handle) {
                utils_1.validate(!this.declarationMap.has(constant.handle), errors.duplicateHandle(constant.handle));
                this.declarationMap.set(constant.handle, constant);
            }
            this.declarationMap.set(`const::${i}`, constant);
            return constant;
        });
        this.functions = functions.map((func, i) => {
            if (func.handle) {
                utils_1.validate(!this.declarationMap.has(func.handle), errors.duplicateHandle(func.handle));
                this.declarationMap.set(func.handle, func);
            }
            this.declarationMap.set(`func::${i}`, func);
            return func;
        });
    }
    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
    addParam(dimensions, handle) {
        const param = new Parameter_1.Parameter(dimensions, handle);
        // if the parameter has a handle, set handle mapping
        if (handle) {
            utils_1.validate(!this.declarationMap.has(handle), errors.duplicateHandle(handle));
            this.declarationMap.set(handle, param);
        }
        // set index mapping and add parameter to the list
        this.declarationMap.set(`param::${this.params.length}`, param);
        this.params.push(param);
    }
    addLocal(dimensions, handle) {
        const variable = new LocalVariable_1.LocalVariable(dimensions, handle);
        // if the variable has a handle, set handle mapping
        if (handle) {
            utils_1.validate(!this.declarationMap.has(handle), errors.duplicateHandle(handle));
            this.declarationMap.set(handle, variable);
        }
        // set index mapping and add local variable to the list
        this.declarationMap.set(`local::${this.locals.length}`, variable);
        this.locals.push(variable);
    }
    getDeclaration(indexOrHandle, kind) {
        return (typeof indexOrHandle === 'string')
            ? this.declarationMap.get(indexOrHandle)
            : this.declarationMap.get(`${kind}::${indexOrHandle}`);
    }
    // EXPRESSION BUILDERS
    // --------------------------------------------------------------------------------------------
    buildLiteralValue(value) {
        return new expressions_1.LiteralValue(value, this.field);
    }
    buildBinaryOperation(operation, lhs, rhs) {
        return new expressions_1.BinaryOperation(operation, lhs, rhs);
    }
    buildUnaryOperation(operation, operand) {
        return new expressions_1.UnaryOperation(operation, operand);
    }
    buildMakeVectorExpression(elements) {
        return new expressions_1.MakeVector(elements);
    }
    buildGetVectorElementExpression(source, index) {
        return new expressions_1.GetVectorElement(source, index);
    }
    buildSliceVectorExpression(source, start, end) {
        return new expressions_1.SliceVector(source, start, end);
    }
    buildMakeMatrixExpression(elements) {
        return new expressions_1.MakeMatrix(elements);
    }
    buildLoadExpression(operation, indexOrHandle) {
        if (operation === 'load.param') {
            const parameter = this.getDeclaration(indexOrHandle, 'param');
            utils_1.validate(parameter !== undefined, errors.paramNotDeclared(indexOrHandle));
            const index = this.params.indexOf(parameter);
            utils_1.validate(index !== -1, errors.paramHandleInvalid(indexOrHandle));
            return new expressions_1.LoadExpression(parameter, index);
        }
        else if (operation === 'load.const') {
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
        const handle = typeof indexOrHandle === 'string' ? indexOrHandle : undefined;
        const statement = new StoreOperation_1.StoreOperation(index, value, handle);
        variable.bind(statement, index);
        return statement;
    }
    buildCallExpression(indexOrHandle, params) {
        const func = this.getDeclaration(indexOrHandle, 'func');
        utils_1.validate(func !== undefined, errors.funcNotDeclared(indexOrHandle));
        const index = this.functions.indexOf(func);
        utils_1.validate(index !== -1, errors.funcHandleInvalid(indexOrHandle));
        return new expressions_1.CallExpression(func, index, params);
    }
}
exports.ExecutionContext = ExecutionContext;
// ERRORS
// ================================================================================================
const errors = {
    duplicateHandle: (h) => `handle ${h} cannot be declared multiple times`,
    constNotDeclared: (p) => `cannot load constant ${p}: constant ${p} has not been declared`,
    constHandleInvalid: (p) => `cannot load constant ${p}: handle does not identify a constant`,
    paramNotDeclared: (p) => `cannot load parameter ${p}: parameter ${p} has not been declared`,
    paramHandleInvalid: (p) => `cannot load parameter ${p}: handle does not identify a parameter`,
    localNotDeclared: (v) => `cannot store into local variable ${v}: local variable ${v} has not been declared`,
    localHandleInvalid: (v) => `cannot store into local variable ${v}: handle does not identify a local variable`,
    funcNotDeclared: (f) => `cannot call function ${f}: function ${f} has not been declared`,
    funcHandleInvalid: (f) => `cannot call function ${f}: handle does not identify a function`
};
//# sourceMappingURL=ExecutionContext.js.map