"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const chevrotain_1 = require("chevrotain");
const AirSchema_1 = require("./AirSchema");
const registers_1 = require("./registers");
const lexer_1 = require("./lexer");
const expressions_1 = require("./expressions");
const errors_1 = require("./errors");
// PARSER DEFINITION
// ================================================================================================
class AirParser extends chevrotain_1.EmbeddedActionsParser {
    constructor() {
        super(lexer_1.allTokens, { errorMessageProvider: errors_1.parserErrorMessageProvider });
        // MODULE
        // --------------------------------------------------------------------------------------------
        this.module = this.RULE('module', () => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Module);
            const schema = this.SUBRULE(this.fieldDeclaration);
            this.MANY1(() => this.SUBRULE(this.constantDeclaration, { ARGS: [schema] }));
            this.MANY2(() => this.SUBRULE(this.airFunction, { ARGS: [schema] }));
            this.AT_LEAST_ONE(() => this.SUBRULE(this.componentDeclaration, { ARGS: [schema] }));
            this.CONSUME(lexer_1.RParen);
            return schema;
        });
        // FINITE FIELD
        // --------------------------------------------------------------------------------------------
        this.fieldDeclaration = this.RULE('fieldDeclaration', () => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Field);
            this.CONSUME(lexer_1.Prime);
            const modulus = this.CONSUME(lexer_1.Literal).image;
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new AirSchema_1.AirSchema('prime', BigInt(modulus)));
        });
        // GLOBAL CONSTANTS
        // --------------------------------------------------------------------------------------------
        this.constantDeclaration = this.RULE('constantDeclaration', (schema) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Const);
            const handle = this.OPTION(() => this.CONSUME(lexer_1.Handle).image);
            const value = this.OR([
                { ALT: () => {
                        this.CONSUME(lexer_1.Scalar);
                        return this.SUBRULE(this.fieldElement);
                    } },
                { ALT: () => {
                        this.CONSUME(lexer_1.Vector);
                        return this.SUBRULE1(this.fieldElementSequence);
                    } },
                { ALT: () => {
                        this.CONSUME(lexer_1.Matrix);
                        const rows = [];
                        this.AT_LEAST_ONE(() => {
                            this.CONSUME2(lexer_1.LParen);
                            rows.push(this.SUBRULE2(this.fieldElementSequence));
                            this.CONSUME2(lexer_1.RParen);
                        });
                        return rows;
                    } }
            ]);
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => schema.addConstant(value, handle));
        });
        // GLOBAL FUNCTIONS
        // --------------------------------------------------------------------------------------------
        this.airFunction = this.RULE('airFunction', (schema) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Function);
            const handle = this.OPTION(() => this.CONSUME(lexer_1.Handle).image);
            // build function context
            const resultType = this.SUBRULE(this.functionResultType);
            const context = this.ACTION(() => schema.createFunctionContext(resultType, handle));
            this.MANY1(() => this.SUBRULE(this.paramDeclaration, { ARGS: [context] }));
            this.MANY2(() => this.SUBRULE(this.localDeclaration, { ARGS: [context] }));
            // build function body
            const statements = [];
            this.MANY3(() => statements.push(this.SUBRULE(this.storeOperation, { ARGS: [context] })));
            const result = this.SUBRULE(this.expression, { ARGS: [context] });
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => schema.addFunction(context, statements, result));
        });
        this.functionResultType = this.RULE('functionResultType', () => {
            this.CONSUME2(lexer_1.LParen);
            this.CONSUME(lexer_1.Result);
            const resultType = this.SUBRULE(this.typeDimensions);
            this.CONSUME2(lexer_1.RParen);
            return resultType;
        });
        this.paramDeclaration = this.RULE('paramDeclaration', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Param);
            const handle = this.OPTION(() => this.CONSUME(lexer_1.Handle).image);
            const dimensions = this.SUBRULE(this.typeDimensions);
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => ctx.addParam(dimensions, handle));
        });
        this.localDeclaration = this.RULE('localDeclaration', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Local);
            const handle = this.OPTION(() => this.CONSUME(lexer_1.Handle).image);
            const dimensions = this.SUBRULE(this.typeDimensions);
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => ctx.addLocal(dimensions, handle));
        });
        this.typeDimensions = this.RULE('typeDimensions', () => {
            const dimensions = this.OR([
                { ALT: () => {
                        this.CONSUME(lexer_1.Scalar);
                        return this.ACTION(() => expressions_1.Dimensions.scalar());
                    } },
                { ALT: () => {
                        this.CONSUME(lexer_1.Vector);
                        const length = this.SUBRULE1(this.integerLiteral);
                        return this.ACTION(() => expressions_1.Dimensions.vector(length));
                    } },
                { ALT: () => {
                        this.CONSUME(lexer_1.Matrix);
                        const rowCount = this.SUBRULE2(this.integerLiteral);
                        const colCount = this.SUBRULE3(this.integerLiteral);
                        return this.ACTION(() => expressions_1.Dimensions.matrix(rowCount, colCount));
                    } }
            ]);
            return dimensions;
        });
        // COMPONENTS
        // --------------------------------------------------------------------------------------------
        this.componentDeclaration = this.RULE('componentDeclaration', (schema) => {
            this.CONSUME1(lexer_1.LParen);
            this.CONSUME(lexer_1.Export);
            const name = this.CONSUME(lexer_1.Identifier).image;
            this.CONSUME2(lexer_1.LParen);
            this.CONSUME(lexer_1.Registers);
            const registers = this.SUBRULE1(this.integerLiteral);
            this.CONSUME2(lexer_1.RParen);
            this.CONSUME3(lexer_1.LParen);
            this.CONSUME(lexer_1.Constraints);
            const constraints = this.SUBRULE2(this.integerLiteral);
            this.CONSUME3(lexer_1.RParen);
            this.CONSUME4(lexer_1.LParen);
            this.CONSUME(lexer_1.Steps);
            const steps = this.SUBRULE3(this.integerLiteral);
            this.CONSUME4(lexer_1.RParen);
            const component = this.ACTION(() => schema.createComponent(name, registers, constraints, steps));
            this.OPTION(() => this.SUBRULE(this.staticRegisters, { ARGS: [component] }));
            this.SUBRULE(this.traceInitializer, { ARGS: [component] });
            this.SUBRULE(this.transitionFunction, { ARGS: [component] });
            this.SUBRULE(this.transitionConstraints, { ARGS: [component] });
            this.CONSUME1(lexer_1.RParen);
            this.ACTION(() => schema.addComponent(component));
        });
        // STATIC REGISTERS
        // --------------------------------------------------------------------------------------------
        this.staticRegisters = this.RULE('staticRegisters', (component) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Static);
            this.MANY1(() => this.SUBRULE(this.inputRegister, { ARGS: [component] }));
            this.MANY2(() => this.SUBRULE(this.maskRegister, { ARGS: [component] }));
            this.MANY3(() => this.SUBRULE(this.cyclicRegister, { ARGS: [component] }));
            this.CONSUME(lexer_1.RParen);
        });
        this.inputRegister = this.RULE('inputRegister', (component) => {
            this.CONSUME1(lexer_1.LParen);
            this.CONSUME(lexer_1.Input);
            const scope = this.OR1([
                { ALT: () => this.CONSUME(lexer_1.Secret).image },
                { ALT: () => this.CONSUME(lexer_1.Public).image }
            ]);
            const binary = this.OPTION1(() => this.CONSUME(lexer_1.Binary)) ? true : false;
            const master = this.OPTION2(() => {
                this.CONSUME2(lexer_1.LParen);
                const relation = this.OR2([
                    { ALT: () => this.CONSUME(lexer_1.ChildOf).image },
                    { ALT: () => this.CONSUME(lexer_1.PeerOf).image }
                ]);
                const index = this.SUBRULE1(this.integerLiteral);
                this.CONSUME2(lexer_1.RParen);
                return { index, relation };
            });
            const steps = this.OPTION3(() => {
                this.CONSUME3(lexer_1.LParen);
                this.CONSUME(lexer_1.Steps);
                const steps = this.SUBRULE2(this.integerLiteral);
                this.CONSUME3(lexer_1.RParen);
                return steps;
            });
            const offset = this.OPTION4(() => {
                this.CONSUME4(lexer_1.LParen);
                this.CONSUME(lexer_1.Shift);
                const slots = this.SUBRULE(this.signedIntegerLiteral);
                this.CONSUME4(lexer_1.RParen);
                return this.ACTION(() => slots);
            });
            this.CONSUME1(lexer_1.RParen);
            this.ACTION(() => component.addInputRegister(scope, binary, master, steps, offset));
        });
        this.maskRegister = this.RULE('maskRegister', (component) => {
            this.CONSUME1(lexer_1.LParen);
            this.CONSUME(lexer_1.Mask);
            const inverted = this.OPTION(() => this.CONSUME(lexer_1.Inverted)) ? true : false;
            this.CONSUME2(lexer_1.LParen);
            this.CONSUME(lexer_1.Input);
            const source = this.CONSUME(lexer_1.Literal).image;
            this.CONSUME2(lexer_1.RParen);
            this.CONSUME1(lexer_1.RParen);
            this.ACTION(() => component.addMaskRegister(Number(source), inverted));
        });
        this.cyclicRegister = this.RULE('cyclicRegister', (component) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Cycle);
            const field = component ? component.field : undefined;
            const values = this.OR([
                { ALT: () => this.SUBRULE(this.prngSequence, { ARGS: [field] }) },
                { ALT: () => this.SUBRULE(this.powerSequence, { ARGS: [field] }) },
                { ALT: () => this.SUBRULE(this.fieldElementSequence, { ARGS: [field] }) }
            ]);
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => component.addCyclicRegister(values));
        });
        this.prngSequence = this.RULE('prngExpression', (field) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Prng);
            const method = this.CONSUME(lexer_1.Sha256).image;
            const seed = this.CONSUME(lexer_1.HexLiteral).image;
            const count = this.CONSUME(lexer_1.Literal).image;
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new registers_1.PrngSequence(method, BigInt(seed), Number(count)));
        });
        this.powerSequence = this.RULE('powerSequence', (field) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Power);
            const base = this.CONSUME1(lexer_1.Literal).image;
            const count = this.CONSUME2(lexer_1.Literal).image;
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new registers_1.PowerSequence(BigInt(base), Number(count)));
        });
        // PROCEDURES
        // --------------------------------------------------------------------------------------------
        this.traceInitializer = this.RULE('traceInitializer', (component) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Init);
            // build context
            const context = this.ACTION(() => component.createProcedureContext('init'));
            this.OPTION(() => this.SUBRULE(this.paramDeclaration, { ARGS: [context] }));
            this.MANY1(() => this.SUBRULE(this.localDeclaration, { ARGS: [context] }));
            // build body
            const statements = [];
            this.MANY2(() => statements.push(this.SUBRULE(this.storeOperation, { ARGS: [context] })));
            const result = this.SUBRULE(this.expression, { ARGS: [context] });
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => component.setTraceInitializer(context, statements, result));
        });
        this.transitionFunction = this.RULE('transitionFunction', (component) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Transition);
            // build context
            const context = this.ACTION(() => component.createProcedureContext('transition'));
            this.MANY1(() => this.SUBRULE(this.localDeclaration, { ARGS: [context] }));
            // build body
            const statements = [];
            this.MANY2(() => statements.push(this.SUBRULE(this.storeOperation, { ARGS: [context] })));
            const result = this.SUBRULE(this.expression, { ARGS: [context] });
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => component.setTransitionFunction(context, statements, result));
        });
        this.transitionConstraints = this.RULE('transitionConstraints', (component) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Evaluation);
            // build context
            const context = this.ACTION(() => component.createProcedureContext('evaluation'));
            this.MANY1(() => this.SUBRULE(this.localDeclaration, { ARGS: [context] }));
            // build body
            const statements = [];
            this.MANY2(() => statements.push(this.SUBRULE(this.storeOperation, { ARGS: [context] })));
            const result = this.SUBRULE(this.expression, { ARGS: [context] });
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => component.setConstraintEvaluator(context, statements, result));
        });
        // EXPRESSIONS
        // --------------------------------------------------------------------------------------------
        this.expression = this.RULE('expression', (ctx) => {
            const result = this.OR([
                { ALT: () => this.SUBRULE(this.binaryOperation, { ARGS: [ctx] }) },
                { ALT: () => this.SUBRULE(this.unaryOperation, { ARGS: [ctx] }) },
                { ALT: () => this.SUBRULE(this.makeVector, { ARGS: [ctx] }) },
                { ALT: () => this.SUBRULE(this.getVectorElement, { ARGS: [ctx] }) },
                { ALT: () => this.SUBRULE(this.sliceVector, { ARGS: [ctx] }) },
                { ALT: () => this.SUBRULE(this.makeMatrix, { ARGS: [ctx] }) },
                { ALT: () => this.SUBRULE(this.loadExpression, { ARGS: [ctx] }) },
                { ALT: () => this.SUBRULE(this.callExpression, { ARGS: [ctx] }) },
                { ALT: () => this.SUBRULE(this.scalarLiteral, { ARGS: [ctx] }) }
            ]);
            return result;
        });
        this.binaryOperation = this.RULE('binaryOperation', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            const op = this.CONSUME(lexer_1.BinaryOp).image;
            const lhs = this.SUBRULE1(this.expression, { ARGS: [ctx] });
            const rhs = this.SUBRULE2(this.expression, { ARGS: [ctx] });
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => ctx.buildBinaryOperation(op, lhs, rhs));
        });
        this.unaryOperation = this.RULE('unaryOperation', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            const op = this.CONSUME(lexer_1.UnaryOp).image;
            const value = this.SUBRULE(this.expression, { ARGS: [ctx] });
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => ctx.buildUnaryOperation(op, value));
        });
        this.scalarLiteral = this.RULE('scalarLiteral', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Scalar);
            const value = this.CONSUME(lexer_1.Literal).image;
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => ctx.buildLiteralValue(BigInt(value)));
        });
        // VECTORS AND MATRIXES
        // --------------------------------------------------------------------------------------------
        this.makeVector = this.RULE('makeVector', (ctx) => {
            const elements = [];
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Vector);
            this.AT_LEAST_ONE(() => elements.push(this.SUBRULE(this.expression, { ARGS: [ctx] })));
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => ctx.buildMakeVectorExpression(elements));
        });
        this.getVectorElement = this.RULE('getVectorElement', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Get);
            const source = this.SUBRULE(this.expression, { ARGS: [ctx] });
            const index = this.SUBRULE(this.integerLiteral);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => ctx.buildGetVectorElementExpression(source, index));
        });
        this.sliceVector = this.RULE('sliceVector', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Slice);
            const source = this.SUBRULE(this.expression, { ARGS: [ctx] });
            const startIdx = this.SUBRULE1(this.integerLiteral);
            const endIdx = this.SUBRULE2(this.integerLiteral);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => ctx.buildSliceVectorExpression(source, startIdx, endIdx));
        });
        this.makeMatrix = this.RULE('makeMatrix', (ctx) => {
            const rows = [];
            this.CONSUME1(lexer_1.LParen);
            this.CONSUME(lexer_1.Matrix);
            this.AT_LEAST_ONE1(() => {
                const row = [];
                this.CONSUME2(lexer_1.LParen);
                this.AT_LEAST_ONE2(() => row.push(this.SUBRULE(this.expression, { ARGS: [ctx] })));
                this.CONSUME2(lexer_1.RParen);
                rows.push(row);
            });
            this.CONSUME1(lexer_1.RParen);
            return this.ACTION(() => ctx.buildMakeMatrixExpression(rows));
        });
        // LOAD AND STORE
        // --------------------------------------------------------------------------------------------
        this.loadExpression = this.RULE('loadExpression', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            const op = this.CONSUME(lexer_1.LoadOp).image;
            const indexOrHandle = this.OR([
                { ALT: () => this.SUBRULE(this.integerLiteral) },
                { ALT: () => this.CONSUME(lexer_1.Handle).image }
            ]);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => ctx.buildLoadExpression(op, indexOrHandle));
        });
        this.storeOperation = this.RULE('storeOperation', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.StoreOp);
            const indexOrHandle = this.OR([
                { ALT: () => this.SUBRULE(this.integerLiteral) },
                { ALT: () => this.CONSUME(lexer_1.Handle).image }
            ]);
            const value = this.SUBRULE(this.expression, { ARGS: [ctx] });
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => ctx.buildStoreOperation(indexOrHandle, value));
        });
        // FUNCTION CALLS
        // --------------------------------------------------------------------------------------------
        this.callExpression = this.RULE('callExpression', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.CallOp);
            const indexOrHandle = this.OR([
                { ALT: () => this.SUBRULE(this.integerLiteral) },
                { ALT: () => this.CONSUME(lexer_1.Handle).image }
            ]);
            const parameters = [];
            this.MANY(() => parameters.push(this.SUBRULE(this.expression, { ARGS: [ctx] })));
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => ctx.buildCallExpression(indexOrHandle, parameters));
        });
        // LITERALS AND ELEMENTS
        // --------------------------------------------------------------------------------------------
        this.integerLiteral = this.RULE('integerLiteral', () => {
            const value = this.CONSUME(lexer_1.Literal).image;
            return this.ACTION(() => Number(value));
        });
        this.signedIntegerLiteral = this.RULE('signedIntegerLiteral', () => {
            const sign = this.OPTION(() => this.CONSUME(lexer_1.Minus)) ? -1 : 1;
            const value = this.CONSUME(lexer_1.Literal).image;
            return this.ACTION(() => Number(value) * sign);
        });
        this.fieldElement = this.RULE('fieldElement', () => {
            const value = this.CONSUME(lexer_1.Literal).image;
            return this.ACTION(() => BigInt(value));
        });
        this.fieldElementSequence = this.RULE('fieldElementSequence', () => {
            const values = [];
            this.AT_LEAST_ONE(() => values.push(this.CONSUME(lexer_1.Literal).image));
            return this.ACTION(() => values.map(v => BigInt(v)));
        });
        this.performSelfAnalysis();
    }
}
// EXPORT PARSER INSTANCE
// ================================================================================================
exports.parser = new AirParser();
//# sourceMappingURL=parser.js.map