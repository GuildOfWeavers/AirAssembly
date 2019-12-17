"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class StoreOperation {
    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(target, expression) {
        this._target = target;
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
        return `(store.local ${this.target} ${this.expression.toString()})`;
    }
}
exports.StoreOperation = StoreOperation;
//# sourceMappingURL=StoreOperation.js.map