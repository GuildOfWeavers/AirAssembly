"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const chevrotain_1 = require("chevrotain");
const errors_1 = require("./errors");
// LITERALS AND IDENTIFIERS
// ================================================================================================
exports.Literal = chevrotain_1.createToken({ name: "Literal", pattern: /0|[1-9]\d*/ });
exports.Identifier = chevrotain_1.createToken({ name: "Identifier", pattern: /\$[a-zA-Z]\w*/ });
// KEYWORDS
// ================================================================================================
exports.Module = chevrotain_1.createToken({ name: "Module", pattern: /module/ });
exports.Field = chevrotain_1.createToken({ name: "Field", pattern: /field/ });
exports.Prime = chevrotain_1.createToken({ name: "Prime", pattern: /prime/ });
exports.Const = chevrotain_1.createToken({ name: "Const", pattern: /const/ });
exports.Static = chevrotain_1.createToken({ name: "Static", pattern: /static/ });
exports.Input = chevrotain_1.createToken({ name: "Input", pattern: /input/ });
exports.Secret = chevrotain_1.createToken({ name: "Secret", pattern: /secret/ });
exports.Public = chevrotain_1.createToken({ name: "Public", pattern: /public/ });
exports.Binary = chevrotain_1.createToken({ name: "Binary", pattern: /binary/ });
exports.Parent = chevrotain_1.createToken({ name: "Parent", pattern: /parent/ });
exports.Steps = chevrotain_1.createToken({ name: "Steps", pattern: /steps/ });
exports.Cycle = chevrotain_1.createToken({ name: "Cycle", pattern: /cycle/ });
exports.When = chevrotain_1.createToken({ name: "When", pattern: /when/ });
exports.Transition = chevrotain_1.createToken({ name: "Transition", pattern: /transition/ });
exports.Evaluation = chevrotain_1.createToken({ name: "Evaluation", pattern: /evaluation/ });
exports.Span = chevrotain_1.createToken({ name: "Span", pattern: /span/ });
exports.Result = chevrotain_1.createToken({ name: "Result", pattern: /result/ });
exports.Local = chevrotain_1.createToken({ name: "Local", pattern: /local/ });
exports.Export = chevrotain_1.createToken({ name: "Export", pattern: /export/ });
exports.Main = chevrotain_1.createToken({ name: "Main", pattern: /main/ });
exports.Init = chevrotain_1.createToken({ name: "Init", pattern: /init/ });
exports.Seed = chevrotain_1.createToken({ name: "Seed", pattern: /seed/ });
// TYPES
// ================================================================================================
exports.Scalar = chevrotain_1.createToken({ name: "Scalar", pattern: /scalar/ });
exports.Vector = chevrotain_1.createToken({ name: "Vector", pattern: /vector/ });
exports.Matrix = chevrotain_1.createToken({ name: "Matrix", pattern: /matrix/ });
// OPERATORS
// ================================================================================================
exports.Get = chevrotain_1.createToken({ name: "Get", pattern: /get/ });
exports.Slice = chevrotain_1.createToken({ name: "Slice", pattern: /slice/ });
exports.BinaryOp = chevrotain_1.createToken({ name: "BinaryOp", pattern: chevrotain_1.Lexer.NA });
exports.Add = chevrotain_1.createToken({ name: "Add", pattern: /add/, categories: exports.BinaryOp });
exports.Sub = chevrotain_1.createToken({ name: "Sub", pattern: /sub/, categories: exports.BinaryOp });
exports.Mul = chevrotain_1.createToken({ name: "Mul", pattern: /mul/, categories: exports.BinaryOp });
exports.Div = chevrotain_1.createToken({ name: "Div", pattern: /div/, categories: exports.BinaryOp });
exports.Exp = chevrotain_1.createToken({ name: "Exp", pattern: /exp/, categories: exports.BinaryOp });
exports.Prod = chevrotain_1.createToken({ name: "Prod", pattern: /prod/, categories: exports.BinaryOp });
exports.UnaryOp = chevrotain_1.createToken({ name: "UnaryOp", pattern: chevrotain_1.Lexer.NA });
exports.Neg = chevrotain_1.createToken({ name: "Neg", pattern: /neg/, categories: exports.UnaryOp });
exports.Inv = chevrotain_1.createToken({ name: "Inv", pattern: /inv/, categories: exports.UnaryOp });
exports.BooleanOp = chevrotain_1.createToken({ name: "BooleanOp", pattern: chevrotain_1.Lexer.NA });
exports.And = chevrotain_1.createToken({ name: "And", pattern: /and/, categories: exports.BooleanOp });
exports.Or = chevrotain_1.createToken({ name: "Or", pattern: /or/, categories: exports.BooleanOp });
exports.Not = chevrotain_1.createToken({ name: "Not", pattern: /not/, categories: exports.BooleanOp });
exports.LoadOp = chevrotain_1.createToken({ name: "LoadOp", pattern: chevrotain_1.Lexer.NA });
exports.LoadConst = chevrotain_1.createToken({ name: "LoadConst", pattern: /load.const/, categories: exports.LoadOp });
exports.LoadTrace = chevrotain_1.createToken({ name: "LoadTrace", pattern: /load.trace/, categories: exports.LoadOp });
exports.LoadStatic = chevrotain_1.createToken({ name: "LoadStatic", pattern: /load.static/, categories: exports.LoadOp });
exports.LoadLocal = chevrotain_1.createToken({ name: "LoadLocal", pattern: /load.local/, categories: exports.LoadOp });
exports.StoreOp = chevrotain_1.createToken({ name: "StoreLocal", pattern: /store.local/ });
// SYMBOLS
// ================================================================================================
exports.LParen = chevrotain_1.createToken({ name: "LParen", pattern: /\(/ });
exports.RParen = chevrotain_1.createToken({ name: "RParen", pattern: /\)/ });
// WHITESPACE
// ================================================================================================
exports.WhiteSpace = chevrotain_1.createToken({ name: "WhiteSpace", pattern: /[ \t\n\r]+/, group: chevrotain_1.Lexer.SKIPPED });
exports.Comment = chevrotain_1.createToken({ name: "Comment", pattern: /#.+/, group: "comments" });
// ALL TOKENS
// ================================================================================================
exports.allTokens = [
    exports.WhiteSpace, exports.Comment,
    exports.Module, exports.Field, exports.Prime, exports.Const, exports.Static, exports.Input, exports.Secret, exports.Public, exports.Binary, exports.Parent, exports.Steps,
    exports.Cycle, exports.Transition, exports.Evaluation, exports.Span, exports.Result, exports.Local, exports.Export, exports.Main, exports.Init, exports.Seed,
    exports.Scalar, exports.Vector, exports.Matrix,
    exports.Get, exports.Slice, exports.BinaryOp, exports.Add, exports.Sub, exports.Mul, exports.Div, exports.Exp, exports.Prod, exports.UnaryOp, exports.Neg, exports.Inv, exports.BooleanOp, exports.And, exports.Or, exports.Not,
    exports.LoadOp, exports.LoadConst, exports.LoadTrace, exports.LoadStatic, exports.LoadLocal, exports.StoreOp,
    exports.LParen, exports.RParen,
    exports.Literal, exports.Identifier
];
// EXPORT LEXER INSTANCE
// ================================================================================================
exports.lexer = new chevrotain_1.Lexer(exports.allTokens, {
    errorMessageProvider: errors_1.lexerErrorMessageProvider,
    ensureOptimizations: true
});
//# sourceMappingURL=lexer.js.map