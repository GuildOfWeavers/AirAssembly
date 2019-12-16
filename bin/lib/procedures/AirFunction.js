"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expressions_1 = require("../expressions");
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class AirFunction {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(context, statements, result, handle) {
        this.params = context.params.slice();
        this.locals = context.locals.slice();
        this.statements = statements.slice();
        if (!result.isVector || !expressions_1.Dimensions.areSameDimensions(result.dimensions, context.result))
            throw new Error(`function must resolve to a ${expressions_1.Dimensions.toString(context.result)} value`);
        this.result = result;
        if (handle !== undefined) {
            this.handle = utils_1.validateHandle(handle);
        }
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get dimensions() {
        return this.result.dimensions;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        let code = `\n    (result ${expressions_1.Dimensions.toExpressionString(this.dimensions)})`;
        if (this.params.length > 0)
            code += `\n    ${this.params.map(p => p.toString()).join(' ')}`;
        if (this.locals.length > 0)
            code += `\n    ${this.locals.map(v => v.toString()).join(' ')}`;
        if (this.statements.length > 0)
            code += `\n    ${this.statements.map(s => s.toString()).join('\n    ')}`;
        code += `\n    ${this.result.toString()}`;
        const handle = this.handle ? ` ${this.handle}` : '';
        return `(function${handle}${code})`;
    }
}
exports.AirFunction = AirFunction;
//# sourceMappingURL=AirFunction.js.map