"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const chevrotain_1 = require("chevrotain");
const AirSchema_1 = require("./AirSchema");
const registers_1 = require("./registers");
const procedures_1 = require("./procedures");
const lexer_1 = require("./lexer");
const expressions_1 = require("./expressions");
const errors_1 = require("./errors");
const ExportDeclaration_1 = require("./exports/ExportDeclaration");
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
            this.OPTION2(() => this.SUBRULE(this.staticRegisters, { ARGS: [schema] }));
            this.MANY2(() => this.SUBRULE(this.airFunction, { ARGS: [schema] }));
            this.SUBRULE(this.transitionFunction, { ARGS: [schema] });
            this.SUBRULE(this.transitionConstraints, { ARGS: [schema] });
            this.SUBRULE(this.exportDeclarations, { ARGS: [schema] });
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
        // MODULE CONSTANTS
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
        // STATIC REGISTERS
        // --------------------------------------------------------------------------------------------
        this.staticRegisters = this.RULE('staticRegisters', (schema) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Static);
            const registers = new registers_1.StaticRegisterSet();
            this.MANY1(() => this.SUBRULE(this.inputRegister, { ARGS: [registers] }));
            this.MANY2(() => this.SUBRULE(this.maskRegister, { ARGS: [registers] }));
            this.MANY3(() => this.SUBRULE(this.cyclicRegister, { ARGS: [registers] }));
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => schema.setStaticRegisters(registers));
        });
        this.inputRegister = this.RULE('inputRegister', (registers) => {
            this.CONSUME1(lexer_1.LParen);
            this.CONSUME(lexer_1.Input);
            const scope = this.OR1([
                { ALT: () => this.CONSUME(lexer_1.Secret).image },
                { ALT: () => this.CONSUME(lexer_1.Public).image }
            ]);
            const binary = this.OPTION1(() => this.CONSUME(lexer_1.Binary)) ? true : false;
            const typeOrParent = this.OR2([
                { ALT: () => this.CONSUME(lexer_1.Scalar).image },
                { ALT: () => this.CONSUME(lexer_1.Vector).image },
                { ALT: () => {
                        this.CONSUME2(lexer_1.LParen);
                        this.CONSUME(lexer_1.Parent);
                        const index = this.SUBRULE1(this.integerLiteral);
                        this.CONSUME2(lexer_1.RParen);
                        return index;
                    } }
            ]);
            const steps = this.OPTION2(() => {
                this.CONSUME3(lexer_1.LParen);
                this.CONSUME(lexer_1.Steps);
                const steps = this.SUBRULE2(this.integerLiteral);
                this.CONSUME3(lexer_1.RParen);
                return steps;
            });
            const offset = this.OPTION3(() => {
                this.CONSUME4(lexer_1.LParen);
                this.CONSUME(lexer_1.Shift);
                const slots = this.SUBRULE(this.signedIntegerLiteral);
                this.CONSUME4(lexer_1.RParen);
                return this.ACTION(() => slots);
            });
            this.CONSUME1(lexer_1.RParen);
            this.ACTION(() => registers.addInput(scope, binary, typeOrParent, offset, steps));
        });
        this.cyclicRegister = this.RULE('cyclicRegister', (registers) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Cycle);
            const values = this.OR([
                { ALT: () => this.SUBRULE(this.prngSequence) },
                { ALT: () => this.SUBRULE(this.fieldElementSequence) }
            ]);
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => registers.addCyclic(values));
        });
        this.maskRegister = this.RULE('maskRegister', (registers) => {
            this.CONSUME1(lexer_1.LParen);
            this.CONSUME(lexer_1.Mask);
            const inverted = this.OPTION(() => this.CONSUME(lexer_1.Inverted)) ? true : false;
            this.CONSUME2(lexer_1.LParen);
            this.CONSUME(lexer_1.Input);
            const source = this.CONSUME(lexer_1.Literal).image;
            this.CONSUME2(lexer_1.RParen);
            this.CONSUME1(lexer_1.RParen);
            this.ACTION(() => registers.addMask(Number(source), inverted));
        });
        this.prngSequence = this.RULE('prngExpression', () => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Prng);
            const method = this.CONSUME(lexer_1.Sha256).image;
            const seed = this.CONSUME(lexer_1.HexLiteral).image;
            const count = this.CONSUME(lexer_1.Literal).image;
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new registers_1.PrngSequence(method, BigInt(seed), Number(count)));
        });
        // PROCEDURES
        // --------------------------------------------------------------------------------------------
        this.transitionFunction = this.RULE('transitionFunction', (schema) => {
            this.CONSUME1(lexer_1.LParen);
            this.CONSUME(lexer_1.Transition);
            // build context
            this.CONSUME2(lexer_1.LParen);
            this.CONSUME(lexer_1.Span);
            const span = this.SUBRULE1(this.integerLiteral);
            this.CONSUME2(lexer_1.RParen);
            this.CONSUME3(lexer_1.LParen);
            this.CONSUME(lexer_1.Result);
            this.CONSUME(lexer_1.Vector);
            const width = this.SUBRULE2(this.integerLiteral);
            this.CONSUME3(lexer_1.RParen);
            const context = this.ACTION(() => new procedures_1.ProcedureContext('transition', schema, span, width));
            this.MANY1(() => this.SUBRULE(this.localDeclaration, { ARGS: [context] }));
            // build body
            const statements = [];
            this.MANY2(() => statements.push(this.SUBRULE(this.storeOperation, { ARGS: [context] })));
            const result = this.SUBRULE(this.expression, { ARGS: [context] });
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => schema.setTransitionFunction(context, statements, result));
        });
        this.transitionConstraints = this.RULE('transitionConstraints', (schema) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Evaluation);
            // build context
            this.CONSUME2(lexer_1.LParen);
            this.CONSUME(lexer_1.Span);
            const span = this.SUBRULE1(this.integerLiteral);
            this.CONSUME2(lexer_1.RParen);
            this.CONSUME3(lexer_1.LParen);
            this.CONSUME(lexer_1.Result);
            this.CONSUME(lexer_1.Vector);
            const width = this.SUBRULE2(this.integerLiteral);
            this.CONSUME3(lexer_1.RParen);
            const context = this.ACTION(() => new procedures_1.ProcedureContext('evaluation', schema, span, width));
            this.MANY1(() => this.SUBRULE(this.localDeclaration, { ARGS: [context] }));
            // build body
            const statements = [];
            this.MANY2(() => statements.push(this.SUBRULE(this.storeOperation, { ARGS: [context] })));
            const result = this.SUBRULE(this.expression, { ARGS: [context] });
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => schema.setConstraintEvaluator(context, statements, result));
        });
        this.airFunction = this.RULE('airFunction', (schema) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Function);
            const handle = this.OPTION(() => this.CONSUME(lexer_1.Handle).image);
            // build function context
            this.CONSUME2(lexer_1.LParen);
            this.CONSUME(lexer_1.Result);
            this.CONSUME(lexer_1.Vector);
            const width = this.SUBRULE2(this.integerLiteral);
            this.CONSUME2(lexer_1.RParen);
            const context = this.ACTION(() => new procedures_1.FunctionContext(schema, width));
            this.MANY1(() => this.SUBRULE(this.paramDeclaration, { ARGS: [context] }));
            this.MANY2(() => this.SUBRULE(this.localDeclaration, { ARGS: [context] }));
            // build function body
            const statements = [];
            this.MANY3(() => statements.push(this.SUBRULE(this.storeOperation, { ARGS: [context] })));
            const result = this.SUBRULE(this.expression, { ARGS: [context] });
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => schema.addFunction(context, statements, result, handle));
        });
        this.paramDeclaration = this.RULE('paramDeclaration', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Param);
            const handle = this.OPTION(() => this.CONSUME(lexer_1.Handle).image);
            this.OR([
                { ALT: () => {
                        this.CONSUME(lexer_1.Scalar);
                        return this.ACTION(() => ctx.add(new procedures_1.Parameter(expressions_1.Dimensions.scalar(), handle)));
                    } },
                { ALT: () => {
                        this.CONSUME(lexer_1.Vector);
                        const length = this.SUBRULE1(this.integerLiteral);
                        return this.ACTION(() => ctx.add(new procedures_1.Parameter(expressions_1.Dimensions.vector(length), handle)));
                    } },
                { ALT: () => {
                        this.CONSUME(lexer_1.Matrix);
                        const rowCount = this.SUBRULE2(this.integerLiteral);
                        const colCount = this.SUBRULE3(this.integerLiteral);
                        return this.ACTION(() => ctx.add(new procedures_1.Parameter(expressions_1.Dimensions.matrix(rowCount, colCount), handle)));
                    } }
            ]);
            this.CONSUME(lexer_1.RParen);
        });
        this.localDeclaration = this.RULE('localDeclaration', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Local);
            const handle = this.OPTION(() => this.CONSUME(lexer_1.Handle).image);
            this.OR([
                { ALT: () => {
                        this.CONSUME(lexer_1.Scalar);
                        return this.ACTION(() => ctx.add(new procedures_1.LocalVariable(expressions_1.Dimensions.scalar(), handle)));
                    } },
                { ALT: () => {
                        this.CONSUME(lexer_1.Vector);
                        const length = this.SUBRULE1(this.integerLiteral);
                        return this.ACTION(() => ctx.add(new procedures_1.LocalVariable(expressions_1.Dimensions.vector(length), handle)));
                    } },
                { ALT: () => {
                        this.CONSUME(lexer_1.Matrix);
                        const rowCount = this.SUBRULE2(this.integerLiteral);
                        const colCount = this.SUBRULE3(this.integerLiteral);
                        return this.ACTION(() => ctx.add(new procedures_1.LocalVariable(expressions_1.Dimensions.matrix(rowCount, colCount), handle)));
                    } }
            ]);
            this.CONSUME(lexer_1.RParen);
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
            return this.ACTION(() => new expressions_1.BinaryOperation(op, lhs, rhs));
        });
        this.unaryOperation = this.RULE('unaryOperation', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            const op = this.CONSUME(lexer_1.UnaryOp).image;
            const value = this.SUBRULE(this.expression, { ARGS: [ctx] });
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.UnaryOperation(op, value));
        });
        this.scalarLiteral = this.RULE('scalarLiteral', () => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Scalar);
            const value = this.CONSUME(lexer_1.Literal).image;
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.LiteralValue(BigInt(value)));
        });
        // VECTORS AND MATRIXES
        // --------------------------------------------------------------------------------------------
        this.makeVector = this.RULE('makeVector', (ctx) => {
            const elements = [];
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Vector);
            this.AT_LEAST_ONE(() => elements.push(this.SUBRULE(this.expression, { ARGS: [ctx] })));
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.MakeVector(elements));
        });
        this.getVectorElement = this.RULE('getVectorElement', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Get);
            const source = this.SUBRULE(this.expression, { ARGS: [ctx] });
            const index = this.SUBRULE(this.integerLiteral);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.GetVectorElement(source, index));
        });
        this.sliceVector = this.RULE('sliceVector', (ctx) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Slice);
            const source = this.SUBRULE(this.expression, { ARGS: [ctx] });
            const startIdx = this.SUBRULE1(this.integerLiteral);
            const endIdx = this.SUBRULE2(this.integerLiteral);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.SliceVector(source, startIdx, endIdx));
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
            return this.ACTION(() => new expressions_1.MakeMatrix(rows));
        });
        // LOAD AND STORE OPERATIONS
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
        // LITERALS
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
        // EXPORTS
        // --------------------------------------------------------------------------------------------
        this.exportDeclarations = this.RULE('exportDeclarations', (schema) => {
            const declarations = [];
            this.AT_LEAST_ONE(() => declarations.push(this.SUBRULE(this.exportDeclaration)));
            this.ACTION(() => schema.setExports(declarations));
        });
        this.exportDeclaration = this.RULE('exportDeclaration', () => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Export);
            let initializer;
            const name = this.OR([
                { ALT: () => {
                        const name = this.CONSUME(lexer_1.Main).image;
                        initializer = this.SUBRULE(this.initExpression);
                        return name;
                    } },
                { ALT: () => {
                        return this.CONSUME(lexer_1.Identifier).image;
                    } }
            ]);
            const cycleLength = this.SUBRULE(this.traceCycleExpression);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new ExportDeclaration_1.ExportDeclaration(name, cycleLength, initializer));
        });
        this.initExpression = this.RULE('initExpression', () => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Init);
            const initializer = this.OR([
                { ALT: () => this.SUBRULE(this.literalVector) },
                { ALT: () => this.CONSUME(lexer_1.Seed).image }
            ]);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => initializer);
        });
        this.literalVector = this.RULE('literalVector', () => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Vector);
            const values = this.SUBRULE(this.fieldElementSequence);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.LiteralValue(values));
        });
        this.traceCycleExpression = this.RULE('traceCycleExpression', () => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Steps);
            const steps = this.CONSUME(lexer_1.Literal).image;
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => Number(steps));
        });
        this.performSelfAnalysis();
    }
}
// EXPORT PARSER INSTANCE
// ================================================================================================
exports.parser = new AirParser();
//# sourceMappingURL=parser.js.map