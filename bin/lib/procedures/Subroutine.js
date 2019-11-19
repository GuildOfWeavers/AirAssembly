"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class Subroutine {
    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(expression, localVarIdx) {
        this._expression = expression;
        this._localVarIdx = localVarIdx;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get expression() {
        return this._expression;
    }
    get localVarIdx() {
        return this._localVarIdx;
    }
    get dimensions() {
        return this._expression.dimensions;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    updateIndex(fromIdx, toIdx) {
        if (this.localVarIdx === fromIdx) {
            this._localVarIdx = toIdx;
        }
    }
    transformExpression(transformer) {
        let transformed = transformer(this.expression);
        if (transformed === this.expression) {
            this.expression.transform(transformer);
        }
        else {
            this._expression = transformed;
        }
    }
    toString() {
        return `(store.local ${this.localVarIdx} ${this.expression.toString()})`;
    }
}
exports.Subroutine = Subroutine;
//# sourceMappingURL=Subroutine.js.map