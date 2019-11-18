"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const lexer_1 = require("./lib/lexer");
const parser_1 = require("./lib/parser");
const jsGenerator_1 = require("./lib/jsGenerator");
const analysis_1 = require("./lib/analysis");
const errors_1 = require("./lib/errors");
const expr = require("./lib/expressions");
const utils_1 = require("./lib/utils");
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
function instantiate(schema, options = {}) {
    const compositionFactor = utils_1.getCompositionFactor(schema);
    const vOptions = validateModuleOptions(options, compositionFactor);
    const module = jsGenerator_1.instantiateModule(schema, vOptions);
    return module;
}
exports.instantiate = instantiate;
function analyze(schema) {
    const transition = analysis_1.analyzeProcedure(schema.transitionFunction);
    const evaluation = analysis_1.analyzeProcedure(schema.constraintEvaluator);
    return { transition, evaluation };
}
exports.analyze = analyze;
// HELPER FUNCTIONS
// ================================================================================================
function validateModuleOptions(options, compositionFactor) {
    const minExtensionFactor = compositionFactor * 2;
    const extensionFactor = options.extensionFactor || minExtensionFactor;
    if (extensionFactor < minExtensionFactor) {
        throw new Error(`extension factor cannot be smaller than ${minExtensionFactor}`);
    }
    else if (!utils_1.isPowerOf2(extensionFactor)) {
        throw new Error(`extension factor ${extensionFactor} is not a power of 2`);
    }
    return {
        limits: { ...DEFAULT_LIMITS, ...options.limits },
        wasmOptions: options.wasmOptions || false,
        extensionFactor: extensionFactor
    };
}
//# sourceMappingURL=index.js.map