"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Expression_1 = require("./Expression");
const TraceSegment_1 = require("./TraceSegment");
const procedures_1 = require("../procedures");
// CLASS DEFINITION
// ================================================================================================
class LoadExpression extends Expression_1.Expression {
    // CONSTRUCTORS
    // --------------------------------------------------------------------------------------------
    constructor(binding, index) {
        super(binding.dimensions);
        this.index = index;
        this.binding = binding;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get source() {
        if (this.binding instanceof procedures_1.Constant)
            return 'const';
        else if (this.binding instanceof procedures_1.Parameter)
            return 'param';
        else if (this.binding instanceof procedures_1.StoreOperation)
            return 'local';
        else if (this.binding instanceof TraceSegment_1.TraceSegment)
            return this.binding.segment;
        else
            throw new Error(`invalid load binding: ${this.binding}`);
    }
    get isStatic() {
        if (this.binding instanceof procedures_1.Constant)
            return true;
        else if (this.binding instanceof procedures_1.Parameter)
            return false;
        else if (this.binding instanceof procedures_1.StoreOperation)
            return this.binding.expression.isStatic;
        else if (this.binding instanceof TraceSegment_1.TraceSegment)
            return false;
        else
            throw new Error(`invalid load binding: ${this.binding}`);
    }
    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(load.${this.source} ${this.index})`;
    }
}
exports.LoadExpression = LoadExpression;
//# sourceMappingURL=LoadExpression.js.map