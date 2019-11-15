// IMPORTS
// ================================================================================================
import { AirSchema, AirModule, StarkLimits, ModuleOptions, WasmOptions } from '@guildofweavers/air-assembly';
import { lexer } from './lib/lexer';
import { parser } from './lib/parser';
import { AssemblyError } from './lib/errors';

// MODULE VARIABLES
// ================================================================================================
const DEFAULT_LIMITS: StarkLimits = {
    maxTraceLength      : 2**20,
    maxTraceRegisters   : 64,
    maxStaticRegisters  : 64,
    maxConstraintCount  : 1024,
    maxConstraintDegree : 16
};

// PUBLIC FUNCTIONS
// ================================================================================================
export function compile(source: Buffer, limits?: Partial<StarkLimits>): AirSchema {

    // tokenize input
    const lexResult = lexer.tokenize(source.toString('utf8'));
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
        throw new AssemblyError(error);
    }

    return schema;
}