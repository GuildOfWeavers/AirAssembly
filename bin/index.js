"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const lexer_1 = require("./lib/lexer");
const parser_1 = require("./lib/parser");
const jsGenerator_1 = require("./lib/jsGenerator");
const analysis_1 = require("./lib/analysis");
const errors_1 = require("./lib/errors");
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
// RE-EXPORTS
// ================================================================================================
var AirSchema_1 = require("./lib/AirSchema");
exports.AirSchema = AirSchema_1.AirSchema;
var registers_1 = require("./lib/registers");
exports.PrngSequence = registers_1.PrngSequence;
var errors_2 = require("./lib/errors");
exports.AssemblyError = errors_2.AssemblyError;
exports.prng = {
    sha256: utils_1.sha256prng
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
    // if limits are specified, validate the schema against them
    if (limits !== undefined) {
        validateLimits(schema, { ...DEFAULT_LIMITS, ...limits });
    }
    return schema;
}
exports.compile = compile;
function instantiate(schema, componentName, options = {}) {
    const component = schema.components.get(componentName);
    if (!component)
        throw new Error(`component with name '${componentName}' does not exist in the provided schema`);
    const compositionFactor = utils_1.getCompositionFactor(component);
    const vOptions = validateModuleOptions(options, compositionFactor);
    validateLimits(schema, vOptions.limits);
    const module = jsGenerator_1.instantiateModule(component, vOptions);
    return module;
}
exports.instantiate = instantiate;
function analyze(schema, componentName) {
    const component = schema.components.get(componentName);
    if (!component)
        throw new Error(`component with name '${componentName}' does not exist in the provided schema`);
    const transition = analysis_1.analyzeProcedure(component.transitionFunction);
    const evaluation = analysis_1.analyzeProcedure(component.constraintEvaluator);
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
function validateLimits(schema, limits) {
    try {
        schema.components.forEach(component => {
            if (component.traceRegisterCount > limits.maxTraceRegisters)
                throw new Error(`number of state registers cannot exceed ${limits.maxTraceRegisters}`);
            else if (component.staticRegisterCount > limits.maxStaticRegisters)
                throw new Error(`number of static registers cannot exceed ${limits.maxStaticRegisters}`);
            else if (component.constraintCount > limits.maxConstraintCount)
                throw new Error(`number of transition constraints cannot exceed ${limits.maxConstraintCount}`);
            else if (component.maxConstraintDegree > limits.maxConstraintDegree)
                throw new Error(`max constraint degree cannot exceed ${limits.maxConstraintDegree}`);
        });
    }
    catch (error) {
        throw new errors_1.AssemblyError([error]);
    }
}
//# sourceMappingURL=index.js.map