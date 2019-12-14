"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Expression_1 = require("./Expression");
const utils_1 = require("./utils");
const utils_2 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class CallExpression extends Expression_1.Expression {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(func, index, parameters) {
        utils_2.validate(func.parameters.length === parameters.length, errors.invalidParamCount(index, func.parameters.length, parameters.length));
        func.parameters.forEach((param, i) => utils_2.validate(utils_1.Dimensions.areSameDimensions(param.dimensions, parameters[i].dimensions), errors.invalidParamType(index, i, param.dimensions)));
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
// ERRORS
// ================================================================================================
const errors = {
    invalidParamCount: (f, e, a) => `invalid function call: function ${f} expects ${e} parameters but received ${a} parameters`,
    invalidParamType: (f, i, d) => `invalid function call: function ${f} expects ${utils_1.Dimensions.toString(d)} value for parameter ${i}`
};
//# sourceMappingURL=CallExpression.js.map