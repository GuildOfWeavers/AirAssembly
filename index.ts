// IMPORTS
// ================================================================================================
import { AirModule, StarkLimits, ModuleOptions, WasmOptions } from '@guildofweavers/air-assembly';
import * as fs from 'fs';
import { AirSchema } from './lib/AirSchema';
import { lexer } from './lib/lexer';
import { parser } from './lib/parser';
import { generateModule } from './lib/jsGenerator';
import { analyzeProcedure } from './lib/analysis';
import { AssemblyError } from './lib/errors';
import * as expr from './lib/expressions';

// MODULE VARIABLES
// ================================================================================================
const DEFAULT_LIMITS: StarkLimits = {
    maxTraceLength      : 2**20,
    maxTraceRegisters   : 64,
    maxStaticRegisters  : 64,
    maxConstraintCount  : 1024,
    maxConstraintDegree : 16
};

// EXPRESSION EXPORTS
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

export function instantiate(sourceOrPath: AirSchema | Buffer | string, options?: Partial<ModuleOptions>): AirModule {
    const schema = (sourceOrPath instanceof AirSchema) ? sourceOrPath : compile(sourceOrPath);
    const module = generateModule(schema);
    return module;
}

export function analyze(schema: AirSchema) {
    const transition = analyzeProcedure(schema.transitionFunction);
    const evaluation = analyzeProcedure(schema.constraintEvaluator);
    return { transition, evaluation };
}