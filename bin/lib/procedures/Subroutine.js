"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class Subroutine {
    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(expression, localVarIdx) {
        this.expression = expression;
        this.localVarIdx = localVarIdx;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get dimensions() {
        return this.expression.dimensions;
    }
    get degree() {
        return this.expression.degree;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    updateAccessorIndex(target, fromIdx, toIdx) {
        // TODO
        /*
        if (this.target === target && this._index === fromIdx) {
            this._index = toIdx;
        }
        */
    }
    toString() {
        return `(store.local ${this.localVarIdx} ${this.expression.toString()})`;
    }
}
exports.Subroutine = Subroutine;
//# sourceMappingURL=Subroutine.js.map