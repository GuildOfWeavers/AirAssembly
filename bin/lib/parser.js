"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const chevrotain_1 = require("chevrotain");
const AirSchema_1 = require("./AirSchema");
const lexer_1 = require("./lexer");
const declarations_1 = require("./declarations");
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
            const schema = new AirSchema_1.AirSchema();
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Module);
            this.SUBRULE(this.fieldDeclaration, { ARGS: [schema] });
            this.MANY(() => this.SUBRULE(this.constantDeclaration, { ARGS: [schema] }));
            this.OPTION(() => this.SUBRULE(this.staticRegisters, { ARGS: [schema] }));
            this.SUBRULE(this.transitionFunction, { ARGS: [schema] });
            this.SUBRULE(this.transitionConstraints, { ARGS: [schema] });
            // TODO: exports
            this.CONSUME(lexer_1.RParen);
            return schema;
        });
        // FINITE FIELD
        // --------------------------------------------------------------------------------------------
        this.fieldDeclaration = this.RULE('fieldDeclaration', (schema) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Field);
            this.CONSUME(lexer_1.Prime);
            const modulus = this.CONSUME(lexer_1.Literal).image;
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => schema.setField(new declarations_1.FieldDeclaration('prime', BigInt(modulus))));
        });
        // GLOBAL CONSTANTS
        // --------------------------------------------------------------------------------------------
        this.constantDeclaration = this.RULE('constantDeclaration', (schema) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Const);
            const value = this.OR([
                { ALT: () => this.SUBRULE(this.literalScalar) },
                { ALT: () => this.SUBRULE(this.literalVector) },
                { ALT: () => this.SUBRULE(this.literalMatrix) }
            ]);
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => schema.addConstant(value));
        });
        this.literalVector = this.RULE('literalVector', () => {
            const values = [];
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Vector);
            this.AT_LEAST_ONE(() => values.push(this.CONSUME(lexer_1.Literal).image));
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.LiteralValue(values.map(v => BigInt(v))));
        });
        this.literalMatrix = this.RULE('literalMatrix', () => {
            const rows = [];
            this.CONSUME1(lexer_1.LParen);
            this.CONSUME(lexer_1.Matrix);
            this.AT_LEAST_ONE1(() => {
                const row = [];
                this.CONSUME2(lexer_1.LParen);
                this.AT_LEAST_ONE2(() => row.push(this.CONSUME(lexer_1.Literal).image));
                this.CONSUME2(lexer_1.RParen);
                rows.push(row);
            });
            this.CONSUME1(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.LiteralValue(rows.map(r => r.map(v => BigInt(v)))));
        });
        this.literalScalar = this.RULE('literalScalar', () => {
            const value = this.CONSUME(lexer_1.Literal).image;
            return this.ACTION(() => new expressions_1.LiteralValue(BigInt(value)));
        });
        // STATIC REGISTERS
        // --------------------------------------------------------------------------------------------
        this.staticRegisters = this.RULE('staticRegisters', (schema) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Static);
            this.MANY(() => this.OR([
                { ALT: () => this.SUBRULE(this.inputRegister, { ARGS: [schema] }) },
                { ALT: () => this.SUBRULE(this.cyclicRegister, { ARGS: [schema] }) }
                // TODO: computed registers
            ]));
            this.CONSUME(lexer_1.RParen);
        });
        this.inputRegister = this.RULE('inputRegister', (schema) => {
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
                        const index = this.CONSUME1(lexer_1.Literal).image;
                        this.CONSUME2(lexer_1.RParen);
                        return this.ACTION(() => Number.parseInt(index, 10));
                    } }
            ]);
            const filling = this.OR3([
                { ALT: () => this.CONSUME(lexer_1.Sparse).image },
                { ALT: () => this.CONSUME(lexer_1.Filled).image }
            ]);
            const steps = this.OPTION2(() => {
                this.CONSUME3(lexer_1.LParen);
                this.CONSUME(lexer_1.Steps);
                const steps = this.CONSUME2(lexer_1.Literal).image;
                this.CONSUME3(lexer_1.RParen);
                return this.ACTION(() => Number.parseInt(steps, 10));
            });
            this.CONSUME1(lexer_1.RParen);
            this.ACTION(() => schema.addInputRegister(scope, binary, typeOrParent, filling, steps));
        });
        this.cyclicRegister = this.RULE('cyclicRegister', (schema) => {
            const values = [];
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Cycle);
            this.AT_LEAST_ONE(() => values.push(this.CONSUME(lexer_1.Literal).image));
            this.CONSUME(lexer_1.RParen);
            this.ACTION(() => schema.addCyclicRegister(values.map(v => BigInt(v))));
        });
        // PROCEDURES
        // --------------------------------------------------------------------------------------------
        this.transitionFunction = this.RULE('transitionFunction', (schema) => {
            this.CONSUME1(lexer_1.LParen);
            this.CONSUME(lexer_1.Transition);
            // signature
            this.CONSUME2(lexer_1.LParen);
            this.CONSUME(lexer_1.Span);
            const span = this.SUBRULE1(this.integerLiteral);
            this.CONSUME2(lexer_1.RParen);
            this.CONSUME3(lexer_1.LParen);
            this.CONSUME(lexer_1.Result);
            this.CONSUME(lexer_1.Vector);
            const width = this.SUBRULE2(this.integerLiteral);
            this.CONSUME3(lexer_1.RParen);
            // locals
            const locals = [];
            this.MANY1(() => locals.push(this.SUBRULE(this.localDeclaration)));
            this.ACTION(() => schema.setTransitionFunctionMeta(span, width, locals));
            // body
            const storeExpressions = [];
            this.MANY2(() => storeExpressions.push(this.SUBRULE(this.storeExpression, { ARGS: [schema] })));
            const resultExpression = this.SUBRULE(this.expression, { ARGS: [schema] });
            this.ACTION(() => schema.setTransitionFunctionBody(resultExpression, storeExpressions));
            this.CONSUME1(lexer_1.RParen);
        });
        this.transitionConstraints = this.RULE('transitionConstraints', (schema) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Evaluation);
            // signature
            this.CONSUME2(lexer_1.LParen);
            this.CONSUME(lexer_1.Span);
            const span = this.SUBRULE1(this.integerLiteral);
            this.CONSUME2(lexer_1.RParen);
            this.CONSUME3(lexer_1.LParen);
            this.CONSUME(lexer_1.Result);
            this.CONSUME(lexer_1.Vector);
            const width = this.SUBRULE2(this.integerLiteral);
            this.CONSUME3(lexer_1.RParen);
            // locals
            const locals = [];
            this.MANY1(() => locals.push(this.SUBRULE(this.localDeclaration)));
            this.ACTION(() => schema.setTransitionConstraintsMeta(span, width, locals));
            // body
            const storeExpressions = [];
            this.MANY2(() => storeExpressions.push(this.SUBRULE(this.storeExpression, { ARGS: [schema] })));
            const resultExpression = this.SUBRULE(this.expression, { ARGS: [schema] });
            this.ACTION(() => schema.setTransitionConstraintsBody(resultExpression, storeExpressions));
            this.CONSUME(lexer_1.RParen);
        });
        this.localDeclaration = this.RULE('localDeclaration', () => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Local);
            const result = this.OR([
                { ALT: () => {
                        this.CONSUME(lexer_1.Scalar);
                        return this.ACTION(() => new declarations_1.LocalVariable(0n));
                    } },
                { ALT: () => {
                        this.CONSUME(lexer_1.Vector);
                        const length = this.SUBRULE1(this.integerLiteral);
                        return this.ACTION(() => {
                            return new declarations_1.LocalVariable(new Array(length).fill(0n));
                        });
                    } },
                { ALT: () => {
                        this.CONSUME(lexer_1.Matrix);
                        const rowCount = this.SUBRULE2(this.integerLiteral);
                        const colCount = this.SUBRULE3(this.integerLiteral);
                        return this.ACTION(() => {
                            const rowDegree = new Array(colCount).fill(0n);
                            return new declarations_1.LocalVariable(new Array(rowCount).fill(rowDegree));
                        });
                    } }
            ]);
            this.CONSUME(lexer_1.RParen);
            return result;
        });
        // EXPRESSIONS
        // --------------------------------------------------------------------------------------------
        this.expression = this.RULE('expression', (schema) => {
            const result = this.OR([
                { ALT: () => this.SUBRULE(this.binaryOperation, { ARGS: [schema] }) },
                { ALT: () => this.SUBRULE(this.unaryOperation, { ARGS: [schema] }) },
                { ALT: () => this.SUBRULE(this.makeVector, { ARGS: [schema] }) },
                { ALT: () => this.SUBRULE(this.getVectorElement, { ARGS: [schema] }) },
                { ALT: () => this.SUBRULE(this.sliceVector, { ARGS: [schema] }) },
                { ALT: () => this.SUBRULE(this.makeMatrix, { ARGS: [schema] }) },
                { ALT: () => this.SUBRULE(this.loadExpression, { ARGS: [schema] }) },
                { ALT: () => this.SUBRULE(this.literalScalar, { ARGS: [schema] }) }
            ]);
            return result;
        });
        this.binaryOperation = this.RULE('binaryOperation', (schema) => {
            this.CONSUME(lexer_1.LParen);
            const op = this.CONSUME(lexer_1.BinaryOp).image;
            const lhs = this.SUBRULE1(this.expression, { ARGS: [schema] });
            const rhs = this.SUBRULE2(this.expression, { ARGS: [schema] });
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.BinaryOperation(op, lhs, rhs));
        });
        this.unaryOperation = this.RULE('unaryOperation', (schema) => {
            this.CONSUME(lexer_1.LParen);
            const op = this.CONSUME(lexer_1.UnaryOp).image;
            const value = this.SUBRULE(this.expression, { ARGS: [schema] });
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.UnaryOperation(op, value));
        });
        // VECTORS AND MATRIXES
        // --------------------------------------------------------------------------------------------
        this.makeVector = this.RULE('makeVector', (schema) => {
            const elements = [];
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Vector);
            this.AT_LEAST_ONE(() => elements.push(this.SUBRULE(this.expression, { ARGS: [schema] })));
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.MakeVector(elements));
        });
        this.getVectorElement = this.RULE('getVectorElement', (schema) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Get);
            const source = this.SUBRULE(this.expression, { ARGS: [schema] });
            const index = this.SUBRULE(this.integerLiteral);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.GetVectorElement(source, index));
        });
        this.sliceVector = this.RULE('sliceVector', (schema) => {
            this.CONSUME(lexer_1.LParen);
            this.CONSUME(lexer_1.Slice);
            const source = this.SUBRULE(this.expression, { ARGS: [schema] });
            const startIdx = this.SUBRULE1(this.integerLiteral);
            const endIdx = this.SUBRULE2(this.integerLiteral);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.SliceVector(source, startIdx, endIdx));
        });
        this.makeMatrix = this.RULE('makeMatrix', (schema) => {
            const rows = [];
            this.CONSUME1(lexer_1.LParen);
            this.CONSUME(lexer_1.Matrix);
            this.AT_LEAST_ONE1(() => {
                const row = [];
                this.CONSUME2(lexer_1.LParen);
                this.AT_LEAST_ONE2(() => row.push(this.SUBRULE(this.expression, { ARGS: [schema] })));
                this.CONSUME2(lexer_1.RParen);
                rows.push(row);
            });
            this.CONSUME1(lexer_1.RParen);
            return this.ACTION(() => new expressions_1.MakeMatrix(rows));
        });
        // LOAD AND STORE OPERATIONS
        // --------------------------------------------------------------------------------------------
        this.loadExpression = this.RULE('loadExpression', (schema) => {
            this.CONSUME(lexer_1.LParen);
            const op = this.CONSUME(lexer_1.LoadOp).image;
            const index = this.SUBRULE(this.integerLiteral);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => schema.buildLoadExpression(op, index));
        });
        this.storeExpression = this.RULE('storeExpression', (schema) => {
            this.CONSUME(lexer_1.LParen);
            const op = this.CONSUME(lexer_1.StoreOp).image;
            const index = this.SUBRULE(this.integerLiteral);
            const value = this.SUBRULE(this.expression);
            this.CONSUME(lexer_1.RParen);
            return this.ACTION(() => schema.buildStoreExpression(op, index, value));
        });
        // LITERALS
        // --------------------------------------------------------------------------------------------
        this.integerLiteral = this.RULE('integerLiteral', () => {
            const value = this.CONSUME(lexer_1.Literal).image;
            return this.ACTION(() => Number.parseInt(value, 10));
        });
        this.performSelfAnalysis();
    }
}
// EXPORT PARSER INSTANCE
// ================================================================================================
exports.parser = new AirParser();
//# sourceMappingURL=parser.js.map