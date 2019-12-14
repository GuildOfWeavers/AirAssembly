"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class AirProcedure {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(context, statements, result) {
        this.name = context.name;
        this.parameters = context.parameters.slice();
        this.localVariables = context.locals.slice();
        this.statements = statements.slice();
        if (!result.isVector || result.dimensions[0] !== context.width)
            throw new Error(`${this.name} procedure must resolve to a vector of ${context.width} elements`);
        this.result = result;
        this.constants = context.constants;
        this.traceRegisters = context.traceRegisters;
        this.staticRegisters = context.staticRegisters;
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
        let code = ``;
        if (this.parameters.length > 0)
            code += `\n      ${this.parameters.map(v => v.toString()).join(' ')}`;
        if (this.localVariables.length > 0)
            code += `\n      ${this.localVariables.map(v => v.toString()).join(' ')}`;
        if (this.statements.length > 0)
            code += `\n      ${this.statements.map(s => s.toString()).join('\n    ')}`;
        code += `\n      ${this.result.toString()}`;
        return `\n    (${this.name}${code})`;
    }
}
exports.AirProcedure = AirProcedure;
//# sourceMappingURL=AirProcedure.js.map