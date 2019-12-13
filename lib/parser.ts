// IMPORTS
// ================================================================================================
import { EmbeddedActionsParser } from "chevrotain";
import { AirSchema } from "./AirSchema";
import { Component } from "./Component";
import { StaticRegisterSet, PrngSequence } from "./registers";
import {
    ExecutionContext, ProcedureContext, FunctionContext, Parameter, LocalVariable, StoreOperation
} from "./procedures";
import {
    allTokens, LParen, RParen, Module, Field, Literal, Prime, Const, Vector, Matrix, Static, Input, Binary, 
    Scalar, Local, Get, Slice, BinaryOp, UnaryOp, LoadOp, StoreOp, Transition, Evaluation, Secret, Public,
    Result, Cycle, Steps, Parent, Mask, Inverted, Export, Identifier, Init, Shift, Minus,
    Prng, Sha256, HexLiteral, Handle, Param, Function, CallOp, Registers, Constraints
} from './lexer';
import {
    Expression, LiteralValue, BinaryOperation, UnaryOperation, MakeVector, MakeMatrix, 
    GetVectorElement, SliceVector, LoadExpression, CallExpression, Dimensions
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
    public module = this.RULE<AirSchema>('module', () => {
        this.CONSUME(LParen);
        this.CONSUME(Module);
        const schema = this.SUBRULE(this.fieldDeclaration);
        this.MANY1(() => this.SUBRULE(this.constantDeclaration,         { ARGS: [schema] }));
        this.MANY2(() => this.SUBRULE(this.airFunction,                 { ARGS: [schema] }));
        this.AT_LEAST_ONE(() => this.SUBRULE(this.componentDeclaration, { ARGS: [schema] }));
        this.CONSUME(RParen);
        return schema;
    });

    // FINITE FIELD
    // --------------------------------------------------------------------------------------------
    private fieldDeclaration = this.RULE<AirSchema>('fieldDeclaration', () => {
        this.CONSUME(LParen);
        this.CONSUME(Field);
        this.CONSUME(Prime);
        const modulus = this.CONSUME(Literal).image;
        this.CONSUME(RParen);
        return this.ACTION(() => new AirSchema('prime', BigInt(modulus)));
    });

    // GLOBAL CONSTANTS
    // --------------------------------------------------------------------------------------------
    private constantDeclaration = this.RULE('constantDeclaration', (schema: AirSchema) => {
        this.CONSUME(LParen);
        this.CONSUME(Const);
        const handle = this.OPTION(() => this.CONSUME(Handle).image);
        const value = this.OR([
            { ALT: () => {
                this.CONSUME(Scalar);
                return this.SUBRULE(this.fieldElement);
            }},
            { ALT: () => {
                this.CONSUME(Vector);
                return this.SUBRULE1(this.fieldElementSequence);
            }},
            { ALT: () => {
                this.CONSUME(Matrix);
                const rows: bigint[][] = [];
                this.AT_LEAST_ONE(() => {
                    this.CONSUME2(LParen);
                    rows.push(this.SUBRULE2(this.fieldElementSequence));
                    this.CONSUME2(RParen);
                });
                return rows;
            }}
        ]);
        this.CONSUME(RParen);
        this.ACTION(() => schema.addConstant(value, handle));
    });

    // GLOBAL FUNCTIONS
    // --------------------------------------------------------------------------------------------
    private airFunction = this.RULE('airFunction', (schema: AirSchema) => {
        this.CONSUME(LParen);
        this.CONSUME(Function);

        const handle = this.OPTION(() => this.CONSUME(Handle).image);

        // build function context
        this.CONSUME2(LParen);
        this.CONSUME(Result);
        this.CONSUME(Vector);
        const width = this.SUBRULE2(this.integerLiteral);
        this.CONSUME2(RParen);
        
        const context = this.ACTION(() => new FunctionContext(schema, width));
        this.MANY1(() => this.SUBRULE(this.paramDeclaration, { ARGS: [context] }));
        this.MANY2(() => this.SUBRULE(this.localDeclaration, { ARGS: [context] }));

        // build function body
        const statements: StoreOperation[] = [];
        this.MANY3(() => statements.push(this.SUBRULE(this.storeOperation, { ARGS: [context] })));
        const result = this.SUBRULE(this.expression, { ARGS: [context] });
        this.CONSUME(RParen);

        this.ACTION(() => schema.addFunction(context, statements, result, handle));
    });

    private paramDeclaration = this.RULE('paramDeclaration', (ctx: ExecutionContext) => {
        this.CONSUME(LParen);
        this.CONSUME(Param);
        const handle = this.OPTION(() => this.CONSUME(Handle).image);
        this.OR([
            { ALT: () => {
                this.CONSUME(Scalar);
                return this.ACTION(() => ctx.add(new Parameter(Dimensions.scalar(), handle)));
            }},
            { ALT: () => {
                this.CONSUME(Vector);
                const length = this.SUBRULE1(this.integerLiteral);
                return this.ACTION(() => ctx.add(new Parameter(Dimensions.vector(length), handle)));
            }},
            { ALT: () => {
                this.CONSUME(Matrix);
                const rowCount = this.SUBRULE2(this.integerLiteral);
                const colCount = this.SUBRULE3(this.integerLiteral);
                return this.ACTION(() => ctx.add(new Parameter(Dimensions.matrix(rowCount, colCount), handle)));
            }}
        ]);
        this.CONSUME(RParen);
    });

    private localDeclaration = this.RULE('localDeclaration', (ctx: ExecutionContext) => {
        this.CONSUME(LParen);
        this.CONSUME(Local);
        const handle = this.OPTION(() => this.CONSUME(Handle).image);
        this.OR([
            { ALT: () => {
                this.CONSUME(Scalar);
                return this.ACTION(() => ctx.add(new LocalVariable(Dimensions.scalar(), handle)));
            }},
            { ALT: () => {
                this.CONSUME(Vector);
                const length = this.SUBRULE1(this.integerLiteral);
                return this.ACTION(() => ctx.add(new LocalVariable(Dimensions.vector(length), handle)));
            }},
            { ALT: () => {
                this.CONSUME(Matrix);
                const rowCount = this.SUBRULE2(this.integerLiteral);
                const colCount = this.SUBRULE3(this.integerLiteral);
                return this.ACTION(() => ctx.add(new LocalVariable(Dimensions.matrix(rowCount, colCount), handle)));
            }}
        ]);
        this.CONSUME(RParen);
    });

    // COMPONENTS
    // --------------------------------------------------------------------------------------------
    private componentDeclaration = this.RULE('componentDeclaration', (schema: AirSchema) => {
        this.CONSUME1(LParen);
        this.CONSUME(Export);
        const name = this.CONSUME(Identifier).image;

        this.CONSUME2(LParen);
        this.CONSUME(Registers);
        const registers = this.SUBRULE1(this.integerLiteral);
        this.CONSUME2(RParen);

        this.CONSUME3(LParen);
        this.CONSUME(Constraints);
        const constraints = this.SUBRULE2(this.integerLiteral);
        this.CONSUME3(RParen);

        this.CONSUME4(LParen);
        this.CONSUME(Steps);
        const steps = this.SUBRULE3(this.integerLiteral);
        this.CONSUME4(RParen);
        
        const component = this.ACTION(() => new Component(name, schema, registers, constraints, steps));

        this.OPTION(() => this.SUBRULE(this.staticRegisters,    { ARGS: [component] }));
        this.SUBRULE(this.traceInitializer,                     { ARGS: [component] });
        this.SUBRULE(this.transitionFunction,                   { ARGS: [component] });
        this.SUBRULE(this.transitionConstraints,                { ARGS: [component] });
        this.CONSUME1(RParen);

        this.ACTION(() => schema.addComponent(component));
    });

    // STATIC REGISTERS
    // --------------------------------------------------------------------------------------------
    private staticRegisters = this.RULE('staticRegisters', (component: Component) => {
        this.CONSUME(LParen);
        this.CONSUME(Static);
        const registers = new StaticRegisterSet(); // TODO: pass cycleLength
        this.MANY1(() => this.SUBRULE(this.inputRegister,   { ARGS: [registers] }));
        this.MANY2(() => this.SUBRULE(this.maskRegister,    { ARGS: [registers] }));
        this.MANY3(() => this.SUBRULE(this.cyclicRegister,  { ARGS: [registers] }));
        this.CONSUME(RParen);
        this.ACTION(() => component.setStaticRegisters(registers));
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

        const offset = this.OPTION3(() => {
            this.CONSUME4(LParen);
            this.CONSUME(Shift);
            const slots = this.SUBRULE(this.signedIntegerLiteral);
            this.CONSUME4(RParen);
            return this.ACTION(() => slots);
        });

        this.CONSUME1(RParen);
        this.ACTION(() => registers.addInput(scope, binary, typeOrParent, offset, steps));
    });

    private cyclicRegister = this.RULE('cyclicRegister', (registers: StaticRegisterSet) => {
        this.CONSUME(LParen);
        this.CONSUME(Cycle);
        const values = this.OR([
            { ALT: () => this.SUBRULE(this.prngSequence)    },
            { ALT: () => this.SUBRULE(this.fieldElementSequence) }
        ]);
        this.CONSUME(RParen);
        this.ACTION(() => registers.addCyclic(values));
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

    private prngSequence = this.RULE<PrngSequence>('prngExpression', () => {
        this.CONSUME(LParen);
        this.CONSUME(Prng);
        const method = this.CONSUME(Sha256).image;
        const seed = this.CONSUME(HexLiteral).image;
        const count = this.CONSUME(Literal).image;
        this.CONSUME(RParen);
        return this.ACTION(() => new PrngSequence(method, BigInt(seed), Number(count)));
    });

    // PROCEDURES
    // --------------------------------------------------------------------------------------------
    private traceInitializer = this.RULE('traceInitializer', (component: Component) => {
        this.CONSUME(LParen);
        this.CONSUME(Init);

        // build context
        const context = this.ACTION(() => new ProcedureContext('init', component));
        this.OPTION(() => this.SUBRULE(this.paramDeclaration, { ARGS: [context] }));
        this.MANY1(() => this.SUBRULE(this.localDeclaration,  { ARGS: [context] }));

        // build body
        const statements: StoreOperation[] = [];
        this.MANY2(() => statements.push(this.SUBRULE(this.storeOperation, { ARGS: [context] })));
        const result = this.SUBRULE(this.expression, { ARGS: [context] });
        this.CONSUME(RParen);

        this.ACTION(() => component.setTraceInitializer(context, statements, result));
    });

    private transitionFunction = this.RULE('transitionFunction', (component: Component) => {
        this.CONSUME1(LParen);
        this.CONSUME(Transition);

        // build context
        const context = this.ACTION(() => new ProcedureContext('transition', component));
        this.MANY1(() => this.SUBRULE(this.localDeclaration, { ARGS: [context] }));

        // build body
        const statements: StoreOperation[] = [];
        this.MANY2(() => statements.push(this.SUBRULE(this.storeOperation, { ARGS: [context] })));
        const result = this.SUBRULE(this.expression, { ARGS: [context] });
        this.CONSUME(RParen);

        this.ACTION(() => component.setTransitionFunction(context, statements, result));
    });

    private transitionConstraints = this.RULE('transitionConstraints', (component: Component) => {
        this.CONSUME(LParen);
        this.CONSUME(Evaluation);
        
        const context = this.ACTION(() => new ProcedureContext('evaluation', component));
        this.MANY1(() => this.SUBRULE(this.localDeclaration, { ARGS: [context] }));
        
        // build body
        const statements: StoreOperation[] = [];
        this.MANY2(() => statements.push(this.SUBRULE(this.storeOperation, { ARGS: [context] })));
        const result = this.SUBRULE(this.expression, { ARGS: [context] });
        this.CONSUME(RParen);

        this.ACTION(() => component.setConstraintEvaluator(context, statements, result));
    });

    // EXPRESSIONS
    // --------------------------------------------------------------------------------------------
    private expression = this.RULE<Expression>('expression', (ctx: ExecutionContext) => {
        const result = this.OR([
            { ALT: () => this.SUBRULE(this.binaryOperation,     { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.unaryOperation,      { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.makeVector,          { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.getVectorElement,    { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.sliceVector,         { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.makeMatrix,          { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.loadExpression,      { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.callExpression,      { ARGS: [ctx] })},
            { ALT: () => this.SUBRULE(this.scalarLiteral,       { ARGS: [ctx] })}
        ]);
        return result;
    });

    private binaryOperation = this.RULE<BinaryOperation>('binaryOperation', (ctx: ExecutionContext) => {
        this.CONSUME(LParen);
        const op = this.CONSUME(BinaryOp).image;
        const lhs = this.SUBRULE1(this.expression, { ARGS: [ctx] });
        const rhs = this.SUBRULE2(this.expression, { ARGS: [ctx] });
        this.CONSUME(RParen);
        return this.ACTION(() => new BinaryOperation(op, lhs, rhs));
    });

    private unaryOperation = this.RULE<UnaryOperation>('unaryOperation', (ctx: ExecutionContext) => {
        this.CONSUME(LParen);
        const op = this.CONSUME(UnaryOp).image;
        const value = this.SUBRULE(this.expression, { ARGS: [ctx] });
        this.CONSUME(RParen);
        return this.ACTION(() => new UnaryOperation(op, value));
    });

    private scalarLiteral = this.RULE<LiteralValue>('scalarLiteral', () => {
        this.CONSUME(LParen);
        this.CONSUME(Scalar);
        const value = this.CONSUME(Literal).image;
        this.CONSUME(RParen);
        return this.ACTION(() => new LiteralValue(BigInt(value)));
    });

    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    private makeVector = this.RULE<MakeVector>('makeVector', (ctx: ExecutionContext) => {
        const elements: Expression[] = [];
        this.CONSUME(LParen);
        this.CONSUME(Vector);
        this.AT_LEAST_ONE(() => elements.push(this.SUBRULE(this.expression, { ARGS: [ctx] })));
        this.CONSUME(RParen);
        return this.ACTION(() => new MakeVector(elements));
    });

    private getVectorElement = this.RULE<GetVectorElement>('getVectorElement', (ctx: ExecutionContext) => {
        this.CONSUME(LParen);
        this.CONSUME(Get);
        const source = this.SUBRULE(this.expression, { ARGS: [ctx] });
        const index = this.SUBRULE(this.integerLiteral);
        this.CONSUME(RParen);
        return this.ACTION(() => new GetVectorElement(source, index));
    });

    private sliceVector = this.RULE<SliceVector>('sliceVector', (ctx: ExecutionContext) => {
        this.CONSUME(LParen);
        this.CONSUME(Slice);
        const source = this.SUBRULE(this.expression, { ARGS: [ctx] });
        const startIdx = this.SUBRULE1(this.integerLiteral);
        const endIdx = this.SUBRULE2(this.integerLiteral);
        this.CONSUME(RParen);
        return this.ACTION(() => new SliceVector(source, startIdx, endIdx));
    });

    private makeMatrix = this.RULE<MakeMatrix>('makeMatrix', (ctx: ExecutionContext) => {
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

    // LOAD AND STORE
    // --------------------------------------------------------------------------------------------
    private loadExpression = this.RULE<LoadExpression>('loadExpression', (ctx: ExecutionContext) => {
        this.CONSUME(LParen);
        const op = this.CONSUME(LoadOp).image;
        const indexOrHandle = this.OR([
            { ALT: () => this.SUBRULE(this.integerLiteral) },
            { ALT: () => this.CONSUME(Handle).image }
        ]);
        this.CONSUME(RParen);
        return this.ACTION(() => ctx.buildLoadExpression(op, indexOrHandle));
    });

    private storeOperation = this.RULE<StoreOperation>('storeOperation', (ctx: ExecutionContext) => {
        this.CONSUME(LParen);
        this.CONSUME(StoreOp);
        const indexOrHandle = this.OR([
            { ALT: () => this.SUBRULE(this.integerLiteral) },
            { ALT: () => this.CONSUME(Handle).image }
        ]);
        const value = this.SUBRULE(this.expression, { ARGS: [ctx] });
        this.CONSUME(RParen);
        return this.ACTION(() => ctx.buildStoreOperation(indexOrHandle, value));
    });

    // FUNCTION CALLS
    // --------------------------------------------------------------------------------------------
    private callExpression = this.RULE<CallExpression>('callExpression', (ctx: ExecutionContext) => {
        this.CONSUME(LParen);
        this.CONSUME(CallOp);
        const indexOrHandle = this.OR([
            { ALT: () => this.SUBRULE(this.integerLiteral) },
            { ALT: () => this.CONSUME(Handle).image }
        ]);
        const parameters: Expression[] = [];
        this.MANY(() => parameters.push(this.SUBRULE(this.expression, { ARGS: [ctx] })));
        this.CONSUME(RParen);
        return this.ACTION(() => ctx.buildCallExpression(indexOrHandle, parameters));
    });

    // LITERALS AND ELEMENTS
    // --------------------------------------------------------------------------------------------
    private integerLiteral = this.RULE<number>('integerLiteral', () => {
        const value = this.CONSUME(Literal).image;
        return this.ACTION(() => Number(value));
    });

    private signedIntegerLiteral = this.RULE<number>('signedIntegerLiteral', () => {
        const sign = this.OPTION(() => this.CONSUME(Minus)) ? -1 : 1;
        const value = this.CONSUME(Literal).image;
        return this.ACTION(() => Number(value) * sign);
    });

    private fieldElement = this.RULE<bigint>('fieldElement', () => {
        const value = this.CONSUME(Literal).image;
        return this.ACTION(() => BigInt(value));
    });

    private fieldElementSequence = this.RULE<bigint[]>('fieldElementSequence', () => {
        const values: string[] = [];
        this.AT_LEAST_ONE(() => values.push(this.CONSUME(Literal).image));
        return this.ACTION(() => values.map(v => BigInt(v)));
    });
}

// EXPORT PARSER INSTANCE
// ================================================================================================
export const parser = new AirParser();