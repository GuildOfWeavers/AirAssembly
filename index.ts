// IMPORTS
// ================================================================================================
import { AirModule, StarkLimits, ModuleOptions, WasmOptions } from '@guildofweavers/air-assembly';
import { lexer } from './lib/lexer';
import { parser } from './lib/parser';
import { AirScriptError } from './lib/errors';

// MODULE VARIABLES
// ================================================================================================
const DEFAULT_LIMITS: StarkLimits = {
    maxTraceLength      : 2**20,
    maxInputRegisters   : 32,
    maxStateRegisters   : 64,
    maxStaticRegisters  : 64,
    maxConstraintCount  : 1024,
    maxConstraintDegree : 16
};

// PUBLIC FUNCTIONS
// ================================================================================================
export function parse(source: Buffer): any {

    // tokenize input
    const lexResult = lexer.tokenize(source.toString('utf8'));
    if(lexResult.errors.length > 0) {
        throw new AirScriptError(lexResult.errors);
    }

    // apply grammar rules
    parser.input = lexResult.tokens;
    const cst = parser.module();
    if (parser.errors.length > 0) {
        throw new AirScriptError(parser.errors);
    }

    return cst;
}