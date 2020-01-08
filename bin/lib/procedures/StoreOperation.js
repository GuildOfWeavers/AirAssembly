"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class StoreOperation {
    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(target, expression, handle) {
        this._target = target;
        this._handle = handle;
        this._expression = expression;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get target() {
        return this._target;
    }
    get expression() {
        return this._expression;
    }
    get dimensions() {
        return this._expression.dimensions;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        const target = this._handle ? this._handle : this.target;
        return `(store.local ${target} ${this.expression.toString()})`;
    }
}
exports.StoreOperation = StoreOperation;
//# sourceMappingURL=StoreOperation.js.map