// IMPORTS
// ================================================================================================
import { EmbeddedActionsParser } from "chevrotain";
import { AirSchema } from "./AirSchema";
import {
    allTokens, LParen, RParen, Module, Field, Literal, Prime, Const, Vector, Matrix, Static, Input,
    Binary, Scalar, Local, Get, Slice, BinaryOp, UnaryOp, LoadOp, StoreOp,
    Transition, Evaluation, Secret, Public, Span, Result, Cycle, Filled, Sparse, Steps, Parent
} from './lexer';
import { FieldDeclaration, LocalVariable } from "./declarations";
import {
    Expression, LiteralValue, BinaryOperation, UnaryOperation, MakeVector, MakeMatrix, 
    GetVectorElement, SliceVector, StoreExpression, LoadExpression
} from "./expressions";
import { parserErrorMessageProvider } from "./errors";

// PARSER DEFINITION
// ================================================================================================
class AirParser extends EmbeddedActionsParser {
    constructor() {
        super(allTokens, { errorMessageProvider: parserErrorMessageProvider });
        this.performSelfAnalysis();
    }

    // MODULE
    // --------------------------------------------------------------------------------------------
    public module = this.RULE('module', () => {
        const schema = new AirSchema();
        this.CONSUME(LParen);
        this.CONSUME(Module);
        this.SUBRULE(this.fieldDeclaration,                     { ARGS: [schema] });
        this.MANY(() => this.SUBRULE(this.constantDeclaration,  { ARGS: [schema] }));
        this.OPTION(() => this.SUBRULE(this.staticRegisters,    { ARGS: [schema] }));
        this.SUBRULE(this.transitionFunction,                   { ARGS: [schema] });
        this.SUBRULE(this.transitionConstraints,                { ARGS: [schema] });
        // TODO: exports
        this.CONSUME(RParen);
        return schema;
    });

    // FINITE FIELD
    // --------------------------------------------------------------------------------------------
    private fieldDeclaration = this.RULE('fieldDeclaration', (schema: AirSchema) => {
        this.CONSUME(LParen);
        this.CONSUME(Field);
        this.CONSUME(Prime);
        const modulus = this.CONSUME(Literal).image;
        this.CONSUME(RParen);
        this.ACTION(() => schema.setField(new FieldDeclaration('prime', BigInt(modulus))));
    });

    // GLOBAL CONSTANTS
    // --------------------------------------------------------------------------------------------
    private constantDeclaration = this.RULE('constantDeclaration', (schema: AirSchema) => {
        this.CONSUME(LParen);
        this.CONSUME(Const);
        const value = this.OR([
            { ALT: () => this.SUBRULE(this.literalScalar) },
            { ALT: () => this.SUBRULE(this.literalVector) },
            { ALT: () => this.SUBRULE(this.literalMatrix) }
        ]);
        this.CONSUME(RParen);
        this.ACTION(() => schema.addConstant(value));
    });

    private literalVector = this.RULE<LiteralValue>('literalVector', () => {
        const values: string[] = [];
        this.CONSUME(LParen);
        this.CONSUME(Vector);
        this.AT_LEAST_ONE(() => values.push(this.CONSUME(Literal).image));
        this.CONSUME(RParen);
        return this.ACTION(() => new LiteralValue(values.map(v => BigInt(v))));
    });

    private literalMatrix = this.RULE<LiteralValue>('literalMatrix', () => {
        const rows: string[][] = [];
        this.CONSUME1(LParen);
        this.CONSUME(Matrix);
        this.AT_LEAST_ONE1(() => {
            const row: string[] = [];
            this.CONSUME2(LParen);
            this.AT_LEAST_ONE2(() => row.push(this.CONSUME(Literal).image));
            this.CONSUME2(RParen);
            rows.push(row);
        });
        this.CONSUME1(RParen);
        return this.ACTION(() => new LiteralValue(rows.map(r => r.map(v => BigInt(v)))));
    });
    
    private literalScalar = this.RULE<LiteralValue>('literalScalar', () => {
        const value = this.CONSUME(Literal).image;
        return this.ACTION(() => new LiteralValue(BigInt(value)));
    });

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    private staticRegisters = this.RULE('staticRegisters', (schema: AirSchema) => { 
        this.CONSUME(LParen);
        this.CONSUME(Static);
        
        this.MANY(() => this.OR([
            { ALT: () => this.SUBRULE(this.inputRegister,   { ARGS: [schema]  })},
            { ALT: () => this.SUBRULE(this.cyclicRegister,  { ARGS: [schema]  })}
            // TODO: computed registers
        ]));
        this.CONSUME(RParen);
    });

    private inputRegister = this.RULE('inputRegister', (schema: AirSchema) => {
        this.CONSUME1(LParen);
        this.CONSUME(Input);

        const scope = this.OR1([
            { ALT: () => this.CONSUME(Secret).image },
            { ALT: () => this.CONSUME(Public).image }
        ]);

        const binary = this.OPTION1(() => this.CONSUME(Binary)) ? true : false;

        const typeOrParent = this.OR2([
            { ALT: () => this.CONSUME(Scalar).image },
            { ALT: () => this.CONSUME(Vector).image },
            { ALT: () => {
                this.CONSUME2(LParen);
                this.CONSUME(Parent);
                const index = this.CONSUME1(Literal).image;
                this.CONSUME2(RParen);
                return this.ACTION(() => Number.parseInt(index, 10));
            }}
        ]);

        const filling = this.OR3([
            { ALT: () => this.CONSUME(Sparse).image },
            { ALT: () => this.CONSUME(Filled).image }
        ]);

        const steps = this.OPTION2(() => {
            this.CONSUME3(LParen);
            this.CONSUME(Steps);
            const steps = this.CONSUME2(Literal).image;
            this.CONSUME3(RParen);
            return this.ACTION(() => Number.parseInt(steps, 10));
        });

        this.CONSUME1(RParen);
        this.ACTION(() => schema.addInputRegister(scope, binary, typeOrParent, filling, steps));
    });

    private cyclicRegister = this.RULE('cyclicRegister', (schema: AirSchema) => {
        const values: string[] = [];
        this.CONSUME(LParen);
        this.CONSUME(Cycle);
        this.AT_LEAST_ONE(() => values.push(this.CONSUME(Literal).image));
        this.CONSUME(RParen);
        this.ACTION(() => schema.addCyclicRegister(values.map(v => BigInt(v))));
    });

    // PROCEDURES
    // --------------------------------------------------------------------------------------------
    private transitionFunction = this.RULE('transitionFunction', (schema: AirSchema) => {
        this.CONSUME1(LParen);
        this.CONSUME(Transition);

        // signature
        this.CONSUME2(LParen);
        this.CONSUME(Span);
        const span = this.SUBRULE1(this.integerLiteral);
        this.CONSUME2(RParen);
        this.CONSUME3(LParen);
        this.CONSUME(Result);
        this.CONSUME(Vector);
        const width = this.SUBRULE2(this.integerLiteral);
        this.CONSUME3(RParen);

        // locals
        const locals: LocalVariable[] = [];
        this.MANY1(() => locals.push(this.SUBRULE(this.localDeclaration)));
        this.ACTION(() => schema.setTransitionFunctionMeta(span, width, locals));

        // body
        const storeExpressions: StoreExpression[] = [];
        this.MANY2(() => storeExpressions.push(this.SUBRULE(this.storeExpression, { ARGS: [schema] })));
        const resultExpression = this.SUBRULE(this.expression, { ARGS: [schema] });
        this.ACTION(() => schema.setTransitionFunctionBody(resultExpression, storeExpressions));

        this.CONSUME1(RParen);
    });

    private transitionConstraints = this.RULE('transitionConstraints', (schema: AirSchema) => {
        this.CONSUME(LParen);
        this.CONSUME(Evaluation);
        
        // signature
        this.CONSUME2(LParen);
        this.CONSUME(Span);
        const span = this.SUBRULE1(this.integerLiteral);
        this.CONSUME2(RParen);
        this.CONSUME3(LParen);
        this.CONSUME(Result);
        this.CONSUME(Vector);
        const width = this.SUBRULE2(this.integerLiteral);
        this.CONSUME3(RParen);

        // locals
        const locals: LocalVariable[] = [];
        this.MANY1(() => locals.push(this.SUBRULE(this.localDeclaration)));
        this.ACTION(() => schema.setTransitionConstraintsMeta(span, width, locals));

        // body
        const storeExpressions: StoreExpression[] = [];
        this.MANY2(() => storeExpressions.push(this.SUBRULE(this.storeExpression, { ARGS: [schema] })));
        const resultExpression = this.SUBRULE(this.expression, { ARGS: [schema] });
        this.ACTION(() => schema.setTransitionConstraintsBody(resultExpression, storeExpressions));

        this.CONSUME(RParen);
    });

    private localDeclaration = this.RULE<LocalVariable>('localDeclaration', () => {
        this.CONSUME(LParen);
        this.CONSUME(Local);
        const result = this.OR([
            { ALT: () => {
                this.CONSUME(Scalar);
                return this.ACTION(() => new LocalVariable(0n));
            }},
            { ALT: () => {
                this.CONSUME(Vector);
                const length = this.SUBRULE1(this.integerLiteral);
                return this.ACTION(() => {
                    return new LocalVariable(new Array(length).fill(0n))
                });
            }},
            { ALT: () => {
                this.CONSUME(Matrix);
                const rowCount = this.SUBRULE2(this.integerLiteral);
                const colCount = this.SUBRULE3(this.integerLiteral);
                return this.ACTION(() => {
                    const rowDegree = new Array(colCount).fill(0n);
                    return new LocalVariable(new Array(rowCount).fill(rowDegree));
                });
            }}
        ]);
        this.CONSUME(RParen);
        return result;
    });

    // EXPRESSIONS
    // --------------------------------------------------------------------------------------------
    private expression = this.RULE<Expression>('expression', (schema: AirSchema) => {
        const result = this.OR([
            { ALT: () => this.SUBRULE(this.binaryOperation,     { ARGS: [schema]  })},
            { ALT: () => this.SUBRULE(this.unaryOperation,      { ARGS: [schema]  })},
            { ALT: () => this.SUBRULE(this.makeVector,          { ARGS: [schema]  })},
            { ALT: () => this.SUBRULE(this.getVectorElement,    { ARGS: [schema]  })},
            { ALT: () => this.SUBRULE(this.sliceVector,         { ARGS: [schema]  })},
            { ALT: () => this.SUBRULE(this.makeMatrix,          { ARGS: [schema]  })},
            { ALT: () => this.SUBRULE(this.loadExpression,      { ARGS: [schema]  })},
            { ALT: () => this.SUBRULE(this.literalScalar,       { ARGS: [schema]  })}
        ]);
        return result;
    });

    private binaryOperation = this.RULE<BinaryOperation>('binaryOperation', (schema: AirSchema) => {
        this.CONSUME(LParen);
        const op = this.CONSUME(BinaryOp).image;
        const lhs = this.SUBRULE1(this.expression, { ARGS: [schema]  });
        const rhs = this.SUBRULE2(this.expression, { ARGS: [schema]  });
        this.CONSUME(RParen);
        return this.ACTION(() => new BinaryOperation(op, lhs, rhs));
    });

    private unaryOperation = this.RULE<UnaryOperation>('unaryOperation', (schema: AirSchema) => {
        this.CONSUME(LParen);
        const op = this.CONSUME(UnaryOp).image;
        const value = this.SUBRULE(this.expression, { ARGS: [schema]  });
        this.CONSUME(RParen);
        return this.ACTION(() => new UnaryOperation(op, value));
    });

    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    private makeVector = this.RULE<MakeVector>('makeVector', (schema: AirSchema) => {
        const elements: Expression[] = [];
        this.CONSUME(LParen);
        this.CONSUME(Vector);
        this.AT_LEAST_ONE(() => elements.push(this.SUBRULE(this.expression, { ARGS: [schema]  })));
        this.CONSUME(RParen);
        return this.ACTION(() => new MakeVector(elements));
    });

    private getVectorElement = this.RULE<GetVectorElement>('getVectorElement', (schema: AirSchema) => {
        this.CONSUME(LParen);
        this.CONSUME(Get);
        const source = this.SUBRULE(this.expression, { ARGS: [schema] });
        const index = this.SUBRULE(this.integerLiteral);
        this.CONSUME(RParen);
        return this.ACTION(() => new GetVectorElement(source, index));
    });

    private sliceVector = this.RULE<SliceVector>('sliceVector', (schema: AirSchema) => {
        this.CONSUME(LParen);
        this.CONSUME(Slice);
        const source = this.SUBRULE(this.expression, { ARGS: [schema] });
        const startIdx = this.SUBRULE1(this.integerLiteral);
        const endIdx = this.SUBRULE2(this.integerLiteral);
        this.CONSUME(RParen);
        return this.ACTION(() => new SliceVector(source, startIdx, endIdx));
    });

    private makeMatrix = this.RULE<MakeMatrix>('makeMatrix', (schema: AirSchema) => {
        const rows: Expression[][] = [];
        this.CONSUME1(LParen);
        this.CONSUME(Matrix);
        this.AT_LEAST_ONE1(() => {
            const row: Expression[] = [];
            this.CONSUME2(LParen);
            this.AT_LEAST_ONE2(() => row.push(this.SUBRULE(this.expression, { ARGS: [schema] })));
            this.CONSUME2(RParen);
            rows.push(row);
        });
        this.CONSUME1(RParen);
        return this.ACTION(() => new MakeMatrix(rows));
    });

    // LOAD AND STORE OPERATIONS
    // --------------------------------------------------------------------------------------------
    private loadExpression = this.RULE<LoadExpression>('loadExpression', (schema: AirSchema) => {
        this.CONSUME(LParen);
        const op = this.CONSUME(LoadOp).image;
        const index = this.SUBRULE(this.integerLiteral);
        this.CONSUME(RParen);
        return this.ACTION(() => schema.buildLoadExpression(op, index));
    });

    private storeExpression = this.RULE<StoreExpression>('storeExpression', (schema: AirSchema) => {
        this.CONSUME(LParen);
        const op = this.CONSUME(StoreOp).image;
        const index = this.SUBRULE(this.integerLiteral);
        const value = this.SUBRULE(this.expression);
        this.CONSUME(RParen);
        return this.ACTION(() => schema.buildStoreExpression(op, index, value));
    });

    // LITERALS
    // --------------------------------------------------------------------------------------------
    private integerLiteral = this.RULE<number>('integerLiteral', () => {
        const value = this.CONSUME(Literal).image;
        return this.ACTION(() => Number.parseInt(value, 10));
    });
}

// EXPORT PARSER INSTANCE
// ================================================================================================
export const parser = new AirParser();