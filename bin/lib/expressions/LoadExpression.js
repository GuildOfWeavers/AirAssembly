"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Expression_1 = require("./Expression");
const LiteralValue_1 = require("./LiteralValue");
const StoreExpression_1 = require("./StoreExpression");
const TraceSegment_1 = require("./TraceSegment");
// CLASS DEFINITION
// ================================================================================================
class LoadExpression extends Expression_1.Expression {
    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(binding, index) {
        super(binding.dimensions, binding.degree);
        this._index = index;
        this.binding = binding;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get index() {
        return this._index;
    }
    get source() {
        if (this.binding instanceof LiteralValue_1.LiteralValue)
            return 'const';
        if (this.binding instanceof StoreExpression_1.StoreExpression)
            return 'local';
        else if (this.binding instanceof TraceSegment_1.TraceSegment)
            return this.binding.segment;
        else
            throw new Error(`invalid load binding: ${this.binding}`);
    }
    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    collectLoadOperations(source, result) {
        if (this.source === source) {
            const bindings = result.get(this.binding) || [];
            bindings.push(this);
            result.set(this.binding, bindings);
        }
    }
    updateAccessorIndex(source, fromIdx, toIdx) {
        if (this.source === source && this._index === fromIdx) {
            this._index = toIdx;
        }
    }
    toString() {
        return `(load.${this.source} ${this.index})`;
    }
}
exports.LoadExpression = LoadExpression;
//# sourceMappingURL=LoadExpression.js.map