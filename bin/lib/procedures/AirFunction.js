"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../expressions/utils");
const utils_2 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class AirFunction {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(context, statements, result, handle) {
        this.parameters = context.parameters.slice();
        this.localVariables = context.locals.slice();
        this.statements = statements.slice();
        if (!result.isVector || result.dimensions[0] !== context.width)
            throw new Error(`function must resolve to a vector of ${context.width} elements`);
        this.result = result;
        if (handle !== undefined) {
            this.handle = utils_2.validateHandle(handle);
        }
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get dimensions() {
        return this.result.dimensions;
    }
    get locals() {
        return this.localVariables.map(v => v.dimensions);
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        let code = `\n    (result ${utils_1.Dimensions.toTypeString(this.dimensions)})`;
        if (this.parameters.length > 0)
            code += `\n    ${this.parameters.map(p => p.toString()).join(' ')}`;
        if (this.localVariables.length > 0)
            code += `\n    ${this.localVariables.map(v => v.toString()).join(' ')}`;
        if (this.statements.length > 0)
            code += `\n    ${this.statements.map(s => s.toString()).join('\n    ')}`;
        code += `\n    ${this.result.toString()}`;
        const handle = this.handle ? ` ${this.handle}` : '';
        return `(function${handle}${code})`;
    }
}
exports.AirFunction = AirFunction;
//# sourceMappingURL=AirFunction.js.map