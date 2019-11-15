"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lexer_1 = require("./lib/lexer");
const parser_1 = require("./lib/parser");
const errors_1 = require("./lib/errors");
// MODULE VARIABLES
// ================================================================================================
const DEFAULT_LIMITS = {
    maxTraceLength: 2 ** 20,
    maxTraceRegisters: 64,
    maxStaticRegisters: 64,
    maxConstraintCount: 1024,
    maxConstraintDegree: 16
};
// PUBLIC FUNCTIONS
// ================================================================================================
function compile(source, limits) {
    // tokenize input
    const lexResult = lexer_1.lexer.tokenize(source.toString('utf8'));
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
        throw new errors_1.AssemblyError(error);
    }
    return schema;
}
exports.compile = compile;
//# sourceMappingURL=index.js.map