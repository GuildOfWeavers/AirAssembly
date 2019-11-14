"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lexer_1 = require("./lib/lexer");
const parser_1 = require("./lib/parser");
const errors_1 = require("./lib/errors");
// MODULE VARIABLES
// ================================================================================================
const DEFAULT_LIMITS = {
    maxTraceLength: 2 ** 20,
    maxInputRegisters: 32,
    maxStateRegisters: 64,
    maxStaticRegisters: 64,
    maxConstraintCount: 1024,
    maxConstraintDegree: 16
};
// PUBLIC FUNCTIONS
// ================================================================================================
function parse(source) {
    // tokenize input
    const lexResult = lexer_1.lexer.tokenize(source.toString('utf8'));
    if (lexResult.errors.length > 0) {
        throw new errors_1.AirScriptError(lexResult.errors);
    }
    // apply grammar rules
    parser_1.parser.input = lexResult.tokens;
    const cst = parser_1.parser.module();
    if (parser_1.parser.errors.length > 0) {
        throw new errors_1.AirScriptError(parser_1.parser.errors);
    }
    return cst;
}
exports.parse = parse;
//# sourceMappingURL=index.js.map