// IMPORTS
// ================================================================================================
import { createToken, Lexer } from "chevrotain";
import { lexerErrorMessageProvider } from "./errors";

// LITERALS AND IDENTIFIERS
// ================================================================================================
export const HexLiteral = createToken({ name: "HexLiteral", pattern: /0x[0-9a-f]+/   });
export const Literal    = createToken({ name: "Literal",    pattern: /0|[1-9]\d*/,  longer_alt: HexLiteral });
export const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z]\w*/   });
export const Handle     = createToken({ name: "Handle",     pattern: /\$[a-zA-Z]\w*/ });

// KEYWORDS
// ================================================================================================
export const Module     = createToken({ name: "Module",     pattern: /module/,      longer_alt: Identifier });
export const Field      = createToken({ name: "Field",      pattern: /field/,       longer_alt: Identifier });
export const Prime      = createToken({ name: "Prime",      pattern: /prime/,       longer_alt: Identifier });

export const Const      = createToken({ name: "Const",      pattern: /const/,       longer_alt: Identifier });
export const Static     = createToken({ name: "Static",     pattern: /static/,      longer_alt: Identifier });

export const Input      = createToken({ name: "Input",      pattern: /input/,       longer_alt: Identifier });
export const Secret     = createToken({ name: "Secret",     pattern: /secret/,      longer_alt: Identifier });
export const Public     = createToken({ name: "Public",     pattern: /public/,      longer_alt: Identifier });
export const Binary     = createToken({ name: "Binary",     pattern: /binary/,      longer_alt: Identifier });
export const Parent     = createToken({ name: "Parent",     pattern: /parent/,      longer_alt: Identifier });
export const Steps      = createToken({ name: "Steps",      pattern: /steps/,       longer_alt: Identifier });
export const Shift      = createToken({ name: "Shift",      pattern: /shift/,       longer_alt: Identifier });

export const Cycle      = createToken({ name: "Cycle",      pattern: /cycle/,       longer_alt: Identifier });
export const Prng       = createToken({ name: "Prng",       pattern: /prng/,        longer_alt: Identifier });
export const Sha256     = createToken({ name: "Sha256",     pattern: /sha256/,      longer_alt: Identifier });

export const Mask       = createToken({ name: "Mask",       pattern: /mask/,        longer_alt: Identifier });
export const Inverted   = createToken({ name: "Inverted",   pattern: /inverted/,    longer_alt: Identifier });

export const Function   = createToken({ name: "Function",   pattern: /function/,    longer_alt: Identifier });
export const Transition = createToken({ name: "Transition", pattern: /transition/,  longer_alt: Identifier });
export const Evaluation = createToken({ name: "Evaluation", pattern: /evaluation/,  longer_alt: Identifier });

export const Span       = createToken({ name: "Span",       pattern: /span/,        longer_alt: Identifier });
export const Result     = createToken({ name: "Result",     pattern: /result/,      longer_alt: Identifier });
export const Param      = createToken({ name: "Param",      pattern: /param/,       longer_alt: Identifier });
export const Local      = createToken({ name: "Local",      pattern: /local/,       longer_alt: Identifier });

export const Export     = createToken({ name: "Export",     pattern: /export/,      longer_alt: Identifier });
export const Main       = createToken({ name: "Main",       pattern: /main/,        longer_alt: Identifier });
export const Init       = createToken({ name: "Init",       pattern: /init/,        longer_alt: Identifier });
export const Seed       = createToken({ name: "Seed",       pattern: /seed/,        longer_alt: Identifier });

// TYPES
// ================================================================================================
export const Scalar     = createToken({ name: "Scalar",     pattern: /scalar/,      longer_alt: Identifier });
export const Vector     = createToken({ name: "Vector",     pattern: /vector/,      longer_alt: Identifier });
export const Matrix     = createToken({ name: "Matrix",     pattern: /matrix/,      longer_alt: Identifier });

// OPERATORS
// ================================================================================================
export const Get        = createToken({ name: "Get",        pattern: /get/,         longer_alt: Identifier });
export const Slice      = createToken({ name: "Slice",      pattern: /slice/,       longer_alt: Identifier });

export const BinaryOp   = createToken({ name: "BinaryOp",   pattern: Lexer.NA       });
export const Add        = createToken({ name: "Add",        pattern: /add/,         longer_alt: Identifier, categories: BinaryOp });
export const Sub        = createToken({ name: "Sub",        pattern: /sub/,         longer_alt: Identifier, categories: BinaryOp });
export const Mul        = createToken({ name: "Mul",        pattern: /mul/,         longer_alt: Identifier, categories: BinaryOp });
export const Div        = createToken({ name: "Div",        pattern: /div/,         longer_alt: Identifier, categories: BinaryOp });
export const Exp        = createToken({ name: "Exp",        pattern: /exp/,         longer_alt: Identifier, categories: BinaryOp });
export const Prod       = createToken({ name: "Prod",       pattern: /prod/,        longer_alt: Identifier, categories: BinaryOp });

export const UnaryOp    = createToken({ name: "UnaryOp",    pattern: Lexer.NA       });
export const Neg        = createToken({ name: "Neg",        pattern: /neg/,         longer_alt: Identifier, categories: UnaryOp  });
export const Inv        = createToken({ name: "Inv",        pattern: /inv/,         longer_alt: Identifier, categories: UnaryOp  });

export const LoadOp     = createToken({ name: "LoadOp",     pattern: Lexer.NA       });
export const LoadConst  = createToken({ name: "LoadConst",  pattern: /load.const/,  longer_alt: Identifier, categories: LoadOp   });
export const LoadTrace  = createToken({ name: "LoadTrace",  pattern: /load.trace/,  longer_alt: Identifier, categories: LoadOp   });
export const LoadStatic = createToken({ name: "LoadStatic", pattern: /load.static/, longer_alt: Identifier, categories: LoadOp   });
export const LoadParam  = createToken({ name: "LoadParam",  pattern: /load.param/,  longer_alt: Identifier, categories: LoadOp   });
export const LoadLocal  = createToken({ name: "LoadLocal",  pattern: /load.local/,  longer_alt: Identifier, categories: LoadOp   });

export const StoreOp    = createToken({ name: "StoreLocal", pattern: /store.local/, longer_alt: Identifier });

// SYMBOLS
// ================================================================================================
export const LParen     = createToken({ name: "LParen",     pattern: /\(/       });
export const RParen     = createToken({ name: "RParen",     pattern: /\)/       });
export const Minus      = createToken({ name: "Minus",      pattern: /-/        });

// WHITESPACE
// ================================================================================================
export const WhiteSpace = createToken({ name: "WhiteSpace", pattern : /[ \t\n\r]+/, group: Lexer.SKIPPED });
export const Comment    = createToken({ name: "Comment",    pattern : /#.+/,        group: "comments" });

// ALL TOKENS
// ================================================================================================
export const allTokens = [
    WhiteSpace, Comment,
    
    Module, Field, Prime, Const, Static, Input, Secret, Public, Binary, Parent, Steps, Shift, Cycle,
    Prng, Sha256, Mask, Inverted, Function, Transition, Evaluation, Span, Result, Param, Local,
    Export, Main, Init, Seed,

    Scalar, Vector, Matrix,

    Get, Slice, BinaryOp, Add, Sub, Mul, Div, Exp, Prod, UnaryOp, Neg, Inv,
    LoadOp, LoadConst, LoadTrace, LoadStatic, LoadParam, LoadLocal, StoreOp,

    LParen, RParen, Minus,

    HexLiteral, Literal, Identifier, Handle
];

// EXPORT LEXER INSTANCE
// ================================================================================================
export const lexer = new Lexer(allTokens, { 
    errorMessageProvider: lexerErrorMessageProvider,
    ensureOptimizations : true 
});