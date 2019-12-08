// IMPORTS
// ================================================================================================
import { AirModule, StarkLimits, AirModuleOptions, SchemaAnalysisResult } from '@guildofweavers/air-assembly';
import * as fs from 'fs';
import { AirSchema } from './lib/AirSchema';
import { lexer } from './lib/lexer';
import { parser } from './lib/parser';
import { instantiateModule } from './lib/jsGenerator';
import { analyzeProcedure } from './lib/analysis';
import { AssemblyError } from './lib/errors';
import { getCompositionFactor, isPowerOf2, sha256prng } from './lib/utils';

// MODULE VARIABLES
// ================================================================================================
const DEFAULT_LIMITS: StarkLimits = {
    maxTraceLength      : 2**20,
    maxTraceRegisters   : 64,
    maxStaticRegisters  : 64,
    maxConstraintCount  : 1024,
    maxConstraintDegree : 16
};

// RE-EXPORTS
// ================================================================================================
export {
    LiteralValue, BinaryOperation, UnaryOperation, MakeVector, GetVectorElement, SliceVector, MakeMatrix,
    LoadExpression
} from './lib/expressions';
export { StaticRegister, InputRegister, CyclicRegister, MaskRegister, StaticRegisterSet } from './lib/registers';
export { ExportDeclaration } from './lib/exports';
export { AssemblyError } from './lib/errors';

export const prng = {
    sha256  : sha256prng
};

// PUBLIC FUNCTIONS
// ================================================================================================
export function compile(sourceOrPath: Buffer | string, limits?: Partial<StarkLimits>): AirSchema {

    let source: string;
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
            throw new AssemblyError([error]);
        }
    }

    // tokenize input
    const lexResult = lexer.tokenize(source);
    if(lexResult.errors.length > 0) {
        throw new AssemblyError(lexResult.errors);
    }

    // parse the tokens
    parser.input = lexResult.tokens;
    const schema = parser.module();
    if (parser.errors.length > 0) {
        throw new AssemblyError(parser.errors);
    }

    // if limits are specified, validate the schema against them
    if (limits !== undefined) {
        validateLimits(schema, { ...DEFAULT_LIMITS, ...limits });
    }

    return schema;
}

export function instantiate(schema: AirSchema, options: Partial<AirModuleOptions> = {}): AirModule {
    const compositionFactor = getCompositionFactor(schema);
    const vOptions = validateModuleOptions(options, compositionFactor);
    validateLimits(schema, vOptions.limits as StarkLimits);
    const module = instantiateModule(schema, vOptions);
    return module;
}

export function analyze(schema: AirSchema): SchemaAnalysisResult {
    const transition = analyzeProcedure(schema.transitionFunction);
    const evaluation = analyzeProcedure(schema.constraintEvaluator);
    return { transition, evaluation };
}

// HELPER FUNCTIONS
// ================================================================================================
function validateModuleOptions(options: Partial<AirModuleOptions>, compositionFactor: number): AirModuleOptions {

    const minExtensionFactor = compositionFactor * 2;
    const extensionFactor = options.extensionFactor || minExtensionFactor;
    if (extensionFactor < minExtensionFactor) {
        throw new Error(`extension factor cannot be smaller than ${minExtensionFactor}`);
    }
    else if (!isPowerOf2(extensionFactor)) {
        throw new Error(`extension factor ${extensionFactor} is not a power of 2`)
    }

    return {
        limits          : { ...DEFAULT_LIMITS, ...options.limits },
        wasmOptions     : options.wasmOptions || false,
        extensionFactor : extensionFactor
    };
}

function validateLimits(schema: AirSchema, limits: StarkLimits): void {
    try {
        if (schema.traceRegisterCount > limits.maxTraceRegisters)
            throw new Error(`number of state registers cannot exceed ${limits.maxTraceRegisters}`);
        else if (schema.staticRegisterCount > limits.maxStaticRegisters)
            throw new Error(`number of static registers cannot exceed ${limits.maxStaticRegisters}`);
        else if (schema.constraintCount > limits.maxConstraintCount)
            throw new Error(`number of transition constraints cannot exceed ${limits.maxConstraintCount}`);
        else if (schema.maxConstraintDegree > limits.maxConstraintDegree)
            throw new Error(`max constraint degree cannot exceed ${limits.maxConstraintDegree}`);
    }
    catch (error) {
        throw new AssemblyError([error]);
    }
}