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
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(store.local ${this.localVarIdx} ${this.expression.toString()})`;
    }
}
exports.Subroutine = Subroutine;
//# sourceMappingURL=Subroutine.js.map