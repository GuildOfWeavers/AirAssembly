"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Expression_1 = require("./Expression");
const utils_1 = require("./utils");
// CLASS DEFINITION
// ================================================================================================
class CallExpression extends Expression_1.Expression {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(func, index, parameters) {
        if (func.parameters.length !== parameters.length) {
            throw new Error('TODO');
        }
        func.parameters.forEach((param, i) => {
            if (!utils_1.Dimensions.areSameDimensions(param.dimensions, parameters[i].dimensions)) {
                throw new Error('TODO');
            }
        });
        super(func.dimensions, parameters);
        this.func = func;
        this.index = index;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get parameters() {
        return this.children;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        const indexOrHandle = (this.func.handle) ? this.func.handle : this.index.toString();
        return `(call ${indexOrHandle} ${this.parameters.map(p => p.toString()).join(' ')})`;
    }
}
exports.CallExpression = CallExpression;
//# sourceMappingURL=CallExpression.js.map