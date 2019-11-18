// IMPORTS
// ================================================================================================
import { AirModule, StarkLimits, ModuleOptions } from '@guildofweavers/air-assembly';
import * as fs from 'fs';
import { AirSchema } from './lib/AirSchema';
import { lexer } from './lib/lexer';
import { parser } from './lib/parser';
import { instantiateModule } from './lib/jsGenerator';
import { analyzeProcedure } from './lib/analysis';
import { AssemblyError } from './lib/errors';
import * as expr from './lib/expressions';
import * as reg from './lib/registers';
import { getCompositionFactor, isPowerOf2 } from './lib/utils';

// MODULE VARIABLES
// ================================================================================================
const DEFAULT_LIMITS: StarkLimits = {
    maxTraceLength      : 2**20,
    maxTraceRegisters   : 64,
    maxStaticRegisters  : 64,
    maxConstraintCount  : 1024,
    maxConstraintDegree : 16
};

// EXPRESSION AND REGISTER EXPORTS
// ================================================================================================
export const expressions = {
    LiteralValue        : expr.LiteralValue,
    BinaryOperation     : expr.BinaryOperation,
    UnaryOperation      : expr.UnaryOperation,
    MakeVector          : expr.MakeVector,
    GetVectorElement    : expr.GetVectorElement,
    SliceVector         : expr.SliceVector,
    MakeMatrix          : expr.MakeMatrix,
    LoadExpression      : expr.LoadExpression
};

export const registers = {
    StaticRegister      : reg.StaticRegister,
    InputRegister       : reg.InputRegister,
    CyclicRegister      : reg.CyclicRegister,
    MaskRegister        : reg.MaskRegister,
    StaticRegisterSet   : reg.StaticRegisterSet
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

    // validate limits
    try {
        schema.validateLimits({ ...DEFAULT_LIMITS, ...limits });
    }
    catch (error) {
        throw new AssemblyError([error]);
    }

    return schema;
}

export function instantiate(schema: AirSchema, options: Partial<ModuleOptions> = {}): AirModule {
    const compositionFactor = getCompositionFactor(schema);
    const vOptions = validateModuleOptions(options, compositionFactor);
    const module = instantiateModule(schema, vOptions);
    return module;
}

export function analyze(schema: AirSchema) {
    const transition = analyzeProcedure(schema.transitionFunction);
    const evaluation = analyzeProcedure(schema.constraintEvaluator);
    return { transition, evaluation };
}

// HELPER FUNCTIONS
// ================================================================================================
function validateModuleOptions(options: Partial<ModuleOptions>, compositionFactor: number): ModuleOptions {

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