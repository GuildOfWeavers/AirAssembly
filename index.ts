// IMPORTS
// ================================================================================================
import { AirModule, StarkLimits, AirModuleOptions, ComponentAnalysisResult } from '@guildofweavers/air-assembly';
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
export { AirSchema } from './lib/AirSchema';
export { PrngSequence } from './lib/registers';
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

export function instantiate(schema: AirSchema, componentName: string, options: Partial<AirModuleOptions> = {}): AirModule {
    const component = schema.components.get(componentName)!;
    if (!component) throw new Error(`component with name '${componentName}' does not exist in the provided schema`);
    const compositionFactor = getCompositionFactor(component);
    const vOptions = validateModuleOptions(options, compositionFactor);
    validateLimits(schema, vOptions.limits as StarkLimits);
    const module = instantiateModule(component, vOptions);
    return module;
}

export function analyze(schema: AirSchema, componentName: string): ComponentAnalysisResult {
    const component = schema.components.get(componentName)!;
    if (!component) throw new Error(`component with name '${componentName}' does not exist in the provided schema`);
    const transition = analyzeProcedure(component.transitionFunction);
    const evaluation = analyzeProcedure(component.constraintEvaluator);
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
        throw new AssemblyError([error]);
    }
}