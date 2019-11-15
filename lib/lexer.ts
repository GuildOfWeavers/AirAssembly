// IMPORTS
// ================================================================================================
import { createToken, Lexer } from "chevrotain";
import { lexerErrorMessageProvider } from "./errors";

// LITERALS AND IDENTIFIERS
// ================================================================================================
export const Literal    = createToken({ name: "Literal",        pattern: /0|[1-9]\d*/       });
export const Identifier = createToken({ name: "Identifier",     pattern: /\$[a-zA-Z]\w*/    });

// KEYWORDS
// ================================================================================================
export const Module     = createToken({ name: "Module",         pattern: /module/           });
export const Field      = createToken({ name: "Field",          pattern: /field/            });
export const Prime      = createToken({ name: "Prime",          pattern: /prime/            });

export const Const      = createToken({ name: "Const",          pattern: /const/            });
export const Static     = createToken({ name: "Static",         pattern: /static/           });

export const Input      = createToken({ name: "Input",          pattern: /input/            });
export const Secret     = createToken({ name: "Secret",         pattern: /secret/           });
export const Public     = createToken({ name: "Public",         pattern: /public/           });
export const Binary     = createToken({ name: "Binary",         pattern: /binary/           });
export const Parent     = createToken({ name: "Parent",         pattern: /parent/           });
export const Steps      = createToken({ name: "Steps",          pattern: /steps/            });

export const Cycle      = createToken({ name: "Cycle",          pattern: /cycle/            });
export const Mask       = createToken({ name: "Mask",           pattern: /mask/             });
export const Value      = createToken({ name: "Value",          pattern: /value/            });

export const Transition = createToken({ name: "Transition",     pattern: /transition/       });
export const Evaluation = createToken({ name: "Evaluation",     pattern: /evaluation/       });

export const Span       = createToken({ name: "Span",           pattern: /span/             });
export const Result     = createToken({ name: "Result",         pattern: /result/           });
export const Local      = createToken({ name: "Local",          pattern: /local/            });

export const Export     = createToken({ name: "Export",         pattern: /export/           });
export const Main       = createToken({ name: "Main",           pattern: /main/             });
export const Init       = createToken({ name: "Init",           pattern: /init/             });
export const Seed       = createToken({ name: "Seed",           pattern: /seed/             });

// TYPES
// ================================================================================================
export const Scalar     = createToken({ name: "Scalar",     pattern: /scalar/   });
export const Vector     = createToken({ name: "Vector",     pattern: /vector/   });
export const Matrix     = createToken({ name: "Matrix",     pattern: /matrix/   });

// OPERATORS
// ================================================================================================
export const Get        = createToken({ name: "Get",        pattern: /get/      });
export const Slice      = createToken({ name: "Slice",      pattern: /slice/    });

export const BinaryOp   = createToken({ name: "BinaryOp",   pattern: Lexer.NA   });
export const Add        = createToken({ name: "Add",        pattern: /add/,         categories: BinaryOp });
export const Sub        = createToken({ name: "Sub",        pattern: /sub/,         categories: BinaryOp });
export const Mul        = createToken({ name: "Mul",        pattern: /mul/,         categories: BinaryOp });
export const Div        = createToken({ name: "Div",        pattern: /div/,         categories: BinaryOp });
export const Exp        = createToken({ name: "Exp",        pattern: /exp/,         categories: BinaryOp });
export const Prod       = createToken({ name: "Prod",       pattern: /prod/,        categories: BinaryOp });

export const UnaryOp    = createToken({ name: "UnaryOp",    pattern: Lexer.NA   });
export const Neg        = createToken({ name: "Neg",        pattern: /neg/,         categories: UnaryOp  });
export const Inv        = createToken({ name: "Inv",        pattern: /inv/,         categories: UnaryOp  });

export const LoadOp     = createToken({ name: "LoadOp",     pattern: Lexer.NA   });
export const LoadConst  = createToken({ name: "LoadConst",  pattern: /load.const/,  categories: LoadOp   });
export const LoadTrace  = createToken({ name: "LoadTrace",  pattern: /load.trace/,  categories: LoadOp   });
export const LoadStatic = createToken({ name: "LoadStatic", pattern: /load.static/, categories: LoadOp   });
export const LoadLocal  = createToken({ name: "LoadLocal",  pattern: /load.local/,  categories: LoadOp   });

export const StoreOp    = createToken({ name: "StoreLocal", pattern: /store.local/ });

// SYMBOLS
// ================================================================================================
export const LParen     = createToken({ name: "LParen",     pattern: /\(/       });
export const RParen     = createToken({ name: "RParen",     pattern: /\)/       });

// WHITESPACE
// ================================================================================================
export const WhiteSpace = createToken({ name: "WhiteSpace", pattern : /[ \t\n\r]+/, group: Lexer.SKIPPED });
export const Comment    = createToken({ name: "Comment",    pattern : /#.+/,        group: "comments" });

// ALL TOKENS
// ================================================================================================
export const allTokens = [
    WhiteSpace, Comment,
    
    Module, Field, Prime, Const, Static, Input, Secret, Public, Binary, Parent, Steps,
    Cycle, Mask, Value, Transition, Evaluation, Span, Result, Local, Export, Main, Init, Seed,

    Scalar, Vector, Matrix,

    Get, Slice, BinaryOp, Add, Sub, Mul, Div, Exp, Prod, UnaryOp, Neg, Inv,
    LoadOp, LoadConst, LoadTrace, LoadStatic, LoadLocal, StoreOp,

    LParen, RParen,

    Literal, Identifier
];

// EXPORT LEXER INSTANCE
// ================================================================================================
export const lexer = new Lexer(allTokens, { 
    errorMessageProvider: lexerErrorMessageProvider,
    ensureOptimizations : true 
});