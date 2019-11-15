"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const lexer_1 = require("./lib/lexer");
const parser_1 = require("./lib/parser");
const jsGenerator_1 = require("./lib/jsGenerator");
const errors_1 = require("./lib/errors");
const expr = require("./lib/expressions");
// MODULE VARIABLES
// ================================================================================================
const DEFAULT_LIMITS = {
    maxTraceLength: 2 ** 20,
    maxTraceRegisters: 64,
    maxStaticRegisters: 64,
    maxConstraintCount: 1024,
    maxConstraintDegree: 16
};
// EXPRESSION EXPORTS
// ================================================================================================
exports.expressions = {
    LiteralValue: expr.LiteralValue,
    BinaryOperation: expr.BinaryOperation,
    UnaryOperation: expr.UnaryOperation,
    MakeVector: expr.MakeVector,
    GetVectorElement: expr.GetVectorElement,
    SliceVector: expr.SliceVector,
    MakeMatrix: expr.MakeMatrix,
    LoadExpression: expr.LoadExpression
};
// PUBLIC FUNCTIONS
// ================================================================================================
function compile(sourceOrPath, limits) {
    let source;
    if (Buffer.isBuffer(sourceOrPath)) {
        source = sourceOrPath.toString('utf8');
    }
    else {
        if (typeof sourceOrPath !== 'string')
            throw new TypeError(`source path '${sourceOrPath}' is invalid`);
        try {
            source = fs.readFileSync(sourceOrPath, { encoding: 'utf8' });
        }
        catch (error) {
            throw new errors_1.AssemblyError([error]);
        }
    }
    // tokenize input
    const lexResult = lexer_1.lexer.tokenize(source);
    if (lexResult.errors.length > 0) {
        throw new errors_1.AssemblyError(lexResult.errors);
    }
    // parse the tokens
    parser_1.parser.input = lexResult.tokens;
    const schema = parser_1.parser.module();
    if (parser_1.parser.errors.length > 0) {
        throw new errors_1.AssemblyError(parser_1.parser.errors);
    }
    // validate limits
    try {
        schema.validateLimits({ ...DEFAULT_LIMITS, ...limits });
    }
    catch (error) {
        throw new errors_1.AssemblyError([error]);
    }
    return schema;
}
exports.compile = compile;
function instantiate(sourceOrPath, options) {
    const schema = compile(sourceOrPath);
    const module = jsGenerator_1.generateModule(schema);
    return module;
}
exports.instantiate = instantiate;
//# sourceMappingURL=index.js.map