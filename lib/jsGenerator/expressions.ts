// IMPORTS
// ================================================================================================
import {
    ExpressionVisitor, Expression, LiteralValue, BinaryOperation, UnaryOperation, MakeVector,
    GetVectorElement, SliceVector, MakeMatrix, LoadExpression, TraceSegment 
} from "../expressions";
import { getBinaryFunction, getUnaryFunction } from "./utils";
import { StoreOperation, Constant } from "../procedures";

// INTERFACES
// ================================================================================================
interface JsCodeOptions {
    vectorAsArray?: boolean;
}

// CODE GENERATOR CLASS
// ================================================================================================
class ExpressionCodeGenerator extends ExpressionVisitor<string> {

    // LITERALS
    // --------------------------------------------------------------------------------------------
    literalValue(e: LiteralValue, options: JsCodeOptions = {}): string {
        if (e.isScalar) {
            return `${e.value}n`;
        }
        else if (e.isVector) {
            const code = `[${(e.value as bigint[]).join('n, ')}n]`;
            return options.vectorAsArray ? code : `f.newVectorFrom(${code})`;
        }
        else {
            const rows = (e.value as bigint[][]).map(r => `[${r.join('n, ')}n]`);
            return `f.newMatrixFrom([${rows.join(', ')}])`;
        }
    }

    // OPERATIONS
    // --------------------------------------------------------------------------------------------
    binaryOperation(e: BinaryOperation, options: JsCodeOptions = {}): string {
        const jsFunction = getBinaryFunction(e.operation, e.lhs, e.rhs);
        let code = `f.${jsFunction}(${this.visit(e.lhs)}, ${this.visit(e.rhs)})`;
        if (e.isVector && options.vectorAsArray) {
            code = `${code}.toValues()`;
        }
        return code;
    }

    unaryOperation(e: UnaryOperation, options: JsCodeOptions = {}): string {
        const jsFunction = getUnaryFunction(e.operation, e.operand);
        let code = `f.${jsFunction}(${this.visit(e.operand)})`;
        if (e.isVector && options.vectorAsArray) {
            code = `${code}.toValues()`;
        }
        return code;
    }

    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    makeVector(e: MakeVector, options: JsCodeOptions = {}): string {
        const elements = e.elements.map(v => 
            v.isVector ? `...${this.visit(v, { vectorAsArray: true })}` : this.visit(v));
        const code = `[${elements.join(', ')}]`;
        return options.vectorAsArray ? code : `f.newVectorFrom(${code})`;
    }

    getVectorElement(e: GetVectorElement): string {
        return `${this.visit(e.source, { vectorAsArray: true })}[${e.index}]`;
    }

    sliceVector(e: SliceVector, options: JsCodeOptions = {}): string {
        const code = this.visit(e.source, { vectorAsArray: true });
        return (options.vectorAsArray)
            ? `${code}.slice(${e.start}, ${e.end + 1})`
            : `f.newVectorFrom(${code}.slice(${e.start}, ${e.end + 1}))`;
    }

    makeMatrix(e: MakeMatrix): string {
        const rows = e.elements.map(r => `[${r.map(v => this.visit(v)).join(', ')}]`);
        return `f.newMatrixFrom([${rows.join(', ')}])`;
    }

    // LOAD EXPRESSION
    // --------------------------------------------------------------------------------------------
    loadExpression(e: LoadExpression, options: JsCodeOptions = {}): string {
        let code = '';
        if (e.binding instanceof TraceSegment) {
            code = getRegisterBankReference(e);
            if (!options.vectorAsArray) {
                code = `f.newVectorFrom(${code})`;
            }
        }
        else {
            if (e.binding instanceof Constant) {
                code = `g[${e.index}]`;
            }
            else if (e.binding instanceof StoreOperation) {
                code = `v${e.index}`;
            }

            if (e.isVector && options.vectorAsArray) {
                code = `${code}.toValues()`;
            }
        }
        return code;
    }
}

// PUBLIC FUNCTIONS
// ================================================================================================
const generator = new ExpressionCodeGenerator();
export function toJsCode(e: Expression, options: JsCodeOptions = {}) {
    return generator.visit(e, options);
}

// HELPER FUNCTIONS
// ================================================================================================
function getRegisterBankReference(e: LoadExpression): string {
    switch (`${e.source}:${e.index}`) {
        case 'static:0' : { return 'k'; }
        case `trace:0`  : { return 'r'; }
        case `trace:1`  : { return 'n'; }
        default: {
            throw new Error(`load source '${e.source}:${e.index}' is invalid`);
        }
    }
}