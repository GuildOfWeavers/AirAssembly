// IMPORTS
// ================================================================================================
import { EmbeddedActionsParser } from "chevrotain";
import { AirSchema } from "./AirSchema";
import { StaticRegisterSet } from "./registers";
import { Procedure } from "./procedures";
import {
    allTokens, LParen, RParen, Module, Field, Literal, Prime, Const, Vector, Matrix, Static, Input, Binary, 
    Scalar, Local, Get, Slice, BinaryOp, UnaryOp, LoadOp, StoreOp, Transition, Evaluation, Secret, Public,
    Span, Result, Cycle, Steps, Parent, Mask, Inverted, Export, Identifier, Main, Init, Seed, Shift, Minus
} from './lexer';
import {
    Expression, LiteralValue, BinaryOperation, UnaryOperation, MakeVector, MakeMatrix, 
    GetVectorElement, SliceVector, LoadExpression, Dimensions
} from "./expressions";
import { parserErrorMessageProvider } from "./errors";
import { ExportDeclaration } from "./exports/ExportDeclaration";

// PARSER DEFINITION
// ================================================================================================
class AirParser extends EmbeddedActionsParser {
    constructor() {
        super(allTokens, { errorMessageProvider: parserErrorMessageProvider });
        this.performSelfAnalysis();
    }

    // MODULE
    // --------------------------------------------------------------------------------------------
    public module = this.RULE<AirSchema>('module', () => {
        const schema = new AirSchema();
        this.CONSUME(LParen);
        this.CONSUME(Module);
        this.SUBRULE(this.fieldDeclaration,                         { ARGS: [schema] });
        this.OPTION1(() => this.SUBRULE(this.constantDeclarations,  { ARGS: [schema] }));
        this.OPTION2(() => this.SUBRULE(this.staticRegisters,       { ARGS: [schema] }));
        this.SUBRULE(this.transitionFunction,                       { ARGS: [schema] });
        this.SUBRULE(this.transitionConstraints,                    { ARGS: [schema] });
        this.SUBRULE(this.exportDeclarations,                       { ARGS: [schema] });
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
        this.ACTION(() => schema.setField('prime', BigInt(modulus)));
    });

    // GLOBAL CONSTANTS
    // --------------------------------------------------------------------------------------------
    private constantDeclarations = this.RULE('constantDeclarations', (schema: AirSchema) => {
        const values: LiteralValue[] = [];
        this.CONSUME(LParen);
        this.CONSUME(Const);
        this.AT_LEAST_ONE(() => {
            const value = this.OR([
                { ALT: () => this.SUBRULE(this.literalScalar) },
                { ALT: () => this.SUBRULE(this.literalVector) },
                { ALT: () => this.SUBRULE(this.literalMatrix) }
            ]);
            values.push(value);
        });
        this.CONSUME(RParen);
        this.ACTION(() => schema.setConstants(values));
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
        this.CONSUME(LParen);
        this.CONSUME(Scalar);
        const value = this.CONSUME(Literal).image;
        this.CONSUME(RParen);
        return this.ACTION(() => new LiteralValue(BigInt(value)));
    });

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    private staticRegisters = this.RULE('staticRegisters', (schema: AirSchema) => { 
        this.CONSUME(LParen);
        this.CONSUME(Static);
        const registers = new StaticRegisterSet();
        this.MANY1(() => this.SUBRULE(this.inputRegister,   { ARGS: [registers] }));
        this.MANY2(() => this.SUBRULE(this.maskRegister,    { ARGS: [registers] }));
        this.MANY3(() => this.SUBRULE(this.cyclicRegister,  { ARGS: [registers] }));
        this.CONSUME(RParen);
        this.ACTION(() => schema.setStaticRegisters(registers));
    });

    private inputRegister = this.RULE('inputRegister', (registers: StaticRegisterSet) => {
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
                const index = this.SUBRULE1(this.integerLiteral);
                this.CONSUME2(RParen);
                return index;
            }}
        ]);

        const steps = this.OPTION2(() => {
            this.CONSUME3(LParen);
            this.CONSUME(Steps);
            const steps = this.SUBRULE2(this.integerLiteral);
            this.CONSUME3(RParen);
            return steps;
        });

        const rotation = this.OPTION3(() => {
            this.CONSUME4(LParen);
            this.CONSUME(Shift);
            const slots = this.SUBRULE(this.signedIntegerLiteral);
            this.CONSUME4(RParen);
            return this.ACTION(() => slots);
        });

        this.CONSUME1(RParen);
        this.ACTION(() => registers.addInput(scope, binary, typeOrParent, rotation, steps));
    });

    private cyclicRegister = this.RULE('cyclicRegister', (registers: StaticRegisterSet) => {
        const values: string[] = [];
        this.CONSUME(LParen);
        this.CONSUME(Cycle);
        this.AT_LEAST_ONE(() => values.push(this.CONSUME(Literal).image));
        this.CONSUME(RParen);
        this.ACTION(() => registers.addCyclic(values.map(v => BigInt(v))));
    });

    private maskRegister = this.RULE('maskRegister', (registers: StaticRegisterSet) => {
        this.CONSUME1(LParen);
        this.CONSUME(Mask);
        const inverted = this.OPTION(() => this.CONSUME(Inverted)) ? true : false;
        this.CONSUME2(LParen);
        this.CONSUME(Input);
        const source = this.CONSUME(Literal).image;
        this.CONSUME2(RParen);
        this.CONSUME1(RParen);
        this.ACTION(() => registers.addMask(Number(source), inverted));
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
        const locals: Dimensions[] = [];
        this.MANY1(() => locals.push(this.SUBRULE(this.localDeclaration)));

        // body
        let procedure: Procedure | undefined;
        this.ACTION(() => procedure = schema.setTransitionFunction(span, width, locals));
        this.MANY2(() => this.SUBRULE(this.procedureSubroutine, { ARGS: [procedure] }));
        const resultExpression = this.SUBRULE(this.expression,  { ARGS: [procedure] });
        this.ACTION(() => schema.transitionFunction.setResult(resultExpression));

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
        const locals: Dimensions[] = [];
        this.MANY1(() => locals.push(this.SUBRULE(this.localDeclaration)));
        
        // body
        let procedure: Procedure | undefined;
        this.ACTION(() => procedure = schema.setConstraintEvaluator(span, width, locals));
        this.MANY2(() => this.SUBRULE(this.procedureSubroutine, { ARGS: [procedure] }));
        const resultExpression = this.SUBRULE(this.expression,  { ARGS: [procedure] });
        this.ACTION(() => schema.constraintEvaluator.setResult(resultExpression));

        this.CONSUME(RParen);
    });

    private localDeclaration = this.RULE<Dimensions>('localDeclaration', () => {
        this.CONSUME(LParen);
        this.CONSUME(Local);
        const result = this.OR([
            { ALT: () => {
                this.CONSUME(Scalar);
                return this.ACTION(() => Dimensions.scalar());
            }},
            { ALT: () => {
                this.CONSUME(Vector);
                const length = this.SUBRULE1(this.integerLiteral);
                return this.ACTION(() => Dimensions.vector(length));
            }},
            { ALT: () => {
                this.CONSUME(Matrix);
                const rowCount = this.SUBRULE2(this.integerLiteral);
                const colCount = this.SUBRULE3(this.integerLiteral);
                return this.ACTION(() => Dimensions.matrix(rowCount, colCount));
            }}
        ]);
        this.CONSUME(RParen);
        return result;
    });

    private procedureSubroutine = this.RULE('procedureSubroutine', (ctx: Procedure) => {
        this.CONSUME(LParen);
        this.CONSUME(StoreOp);
        const index = this.SUBRULE(this.integerLiteral);
        const value = this.SUBRULE(this.expression, { ARGS: [ctx] });
        this.CONSUME(RParen);
        return this.ACTION(() => ctx.addSubroutine(value, index));
    });

    // EXPRESSIONS
    // --------------------------------------------------------------------------------------------
    private expression = this.RULE<Expression>('expression', (ctx: Procedure) => {
        const result = this.OR([
            { ALT: () => this.SUBRULE(this.binaryOperation,     { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.unaryOperation,      { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.makeVector,          { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.getVectorElement,    { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.sliceVector,         { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.makeMatrix,          { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.loadExpression,      { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.literalScalar,       { ARGS: [ctx] })}
        ]);
        return result;
    });

    private binaryOperation = this.RULE<BinaryOperation>('binaryOperation', (ctx: Procedure) => {
        this.CONSUME(LParen);
        const op = this.CONSUME(BinaryOp).image;
        const lhs = this.SUBRULE1(this.expression, { ARGS: [ctx] });
        const rhs = this.SUBRULE2(this.expression, { ARGS: [ctx] });
        this.CONSUME(RParen);
        return this.ACTION(() => new BinaryOperation(op, lhs, rhs));
    });

    private unaryOperation = this.RULE<UnaryOperation>('unaryOperation', (ctx: Procedure) => {
        this.CONSUME(LParen);
        const op = this.CONSUME(UnaryOp).image;
        const value = this.SUBRULE(this.expression, { ARGS: [ctx] });
        this.CONSUME(RParen);
        return this.ACTION(() => new UnaryOperation(op, value));
    });

    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    private makeVector = this.RULE<MakeVector>('makeVector', (ctx: Procedure) => {
        const elements: Expression[] = [];
        this.CONSUME(LParen);
        this.CONSUME(Vector);
        this.AT_LEAST_ONE(() => elements.push(this.SUBRULE(this.expression, { ARGS: [ctx] })));
        this.CONSUME(RParen);
        return this.ACTION(() => new MakeVector(elements));
    });

    private getVectorElement = this.RULE<GetVectorElement>('getVectorElement', (ctx: Procedure) => {
        this.CONSUME(LParen);
        this.CONSUME(Get);
        const source = this.SUBRULE(this.expression, { ARGS: [ctx] });
        const index = this.SUBRULE(this.integerLiteral);
        this.CONSUME(RParen);
        return this.ACTION(() => new GetVectorElement(source, index));
    });

    private sliceVector = this.RULE<SliceVector>('sliceVector', (ctx: Procedure) => {
        this.CONSUME(LParen);
        this.CONSUME(Slice);
        const source = this.SUBRULE(this.expression, { ARGS: [ctx] });
        const startIdx = this.SUBRULE1(this.integerLiteral);
        const endIdx = this.SUBRULE2(this.integerLiteral);
        this.CONSUME(RParen);
        return this.ACTION(() => new SliceVector(source, startIdx, endIdx));
    });

    private makeMatrix = this.RULE<MakeMatrix>('makeMatrix', (ctx: Procedure) => {
        const rows: Expression[][] = [];
        this.CONSUME1(LParen);
        this.CONSUME(Matrix);
        this.AT_LEAST_ONE1(() => {
            const row: Expression[] = [];
            this.CONSUME2(LParen);
            this.AT_LEAST_ONE2(() => row.push(this.SUBRULE(this.expression, { ARGS: [ctx] })));
            this.CONSUME2(RParen);
            rows.push(row);
        });
        this.CONSUME1(RParen);
        return this.ACTION(() => new MakeMatrix(rows));
    });

    // LOAD AND STORE OPERATIONS
    // --------------------------------------------------------------------------------------------
    private loadExpression = this.RULE<LoadExpression>('loadExpression', (ctx: Procedure) => {
        this.CONSUME(LParen);
        const op = this.CONSUME(LoadOp).image;
        const index = this.SUBRULE(this.integerLiteral);
        this.CONSUME(RParen);
        return this.ACTION(() => ctx.buildLoadExpression(op, index));
    });

    // LITERALS
    // --------------------------------------------------------------------------------------------
    private integerLiteral = this.RULE<number>('integerLiteral', () => {
        const value = this.CONSUME(Literal).image;
        return this.ACTION(() => Number.parseInt(value, 10));
    });

    private signedIntegerLiteral = this.RULE<number>('signedIntegerLiteral', () => {
        const sign = this.OPTION(() => this.CONSUME(Minus)) ? -1 : 1;
        const value = this.CONSUME(Literal).image;
        return this.ACTION(() => Number(value) * sign);
    });

    // EXPORTS
    // --------------------------------------------------------------------------------------------
    private exportDeclarations = this.RULE('exportDeclarations', (schema: AirSchema) => {
        const declarations: ExportDeclaration[] = []; 
        this.AT_LEAST_ONE(() => declarations.push(this.SUBRULE(this.exportDeclaration)));
        this.ACTION(() => schema.setExports(declarations));
    });

    private exportDeclaration = this.RULE<ExportDeclaration>('exportDeclaration', () => {
        this.CONSUME(LParen);
        this.CONSUME(Export);
        let initializer: LiteralValue | 'seed' | undefined;
        const name = this.OR([
            { ALT: () => {
                const name = this.CONSUME(Main).image;
                initializer = this.SUBRULE(this.initExpression);
                return name;
            }},
            { ALT: () => {
                return this.CONSUME(Identifier).image;
            }}
        ]);
        const cycleLength = this.SUBRULE(this.traceCycleExpression);
        this.CONSUME(RParen);
        return this.ACTION(() => new ExportDeclaration(name, cycleLength, initializer));
    });

    private initExpression = this.RULE<LiteralValue | 'seed'>('initExpression', () => {
        this.CONSUME(LParen);
        this.CONSUME(Init);
        const initializer = this.OR([
            { ALT: () => this.SUBRULE(this.literalVector)   },
            { ALT: () => this.CONSUME(Seed).image           }
        ]);
        this.CONSUME(RParen);
        return this.ACTION(() => initializer);
    });

    private traceCycleExpression = this.RULE<number>('traceCycleExpression', () => {
        this.CONSUME(LParen);
        this.CONSUME(Steps);
        const steps = this.CONSUME(Literal).image;
        this.CONSUME(RParen);
        return this.ACTION(() => Number(steps));
    });
}

// EXPORT PARSER INSTANCE
// ================================================================================================
export const parser = new AirParser();