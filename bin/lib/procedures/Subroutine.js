"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class Subroutine {
    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(expression, localIndex) {
        this.expression = expression;
        this.localIndex = localIndex;
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
        return `(store.local ${this.localIndex} ${this.expression.toString()})`;
    }
}
exports.Subroutine = Subroutine;
//# sourceMappingURL=Subroutine.js.map