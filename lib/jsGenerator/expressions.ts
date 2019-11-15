// IMPORTS
// ================================================================================================
import {
    ExpressionVisitor, Expression, LiteralValue, BinaryOperation, UnaryOperation, MakeVector,
    GetVectorElement, SliceVector, MakeMatrix, LoadExpression, TraceSegment 
} from "../expressions";
import { getBinaryFunction, getUnaryFunction } from "./utils";
import { Subroutine } from "../procedures";

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

    // LOAD AND STORE
    // --------------------------------------------------------------------------------------------
    loadExpression(e: LoadExpression, options: JsCodeOptions = {}): string {
        // TODO: revisit
        let code = '';
        if (e.binding instanceof LiteralValue) {
            code = `g[${e.index}]`;
        }
        else if (e.binding instanceof Subroutine) {
            code = `v${e.index}`;
        }
        else if (e.binding instanceof TraceSegment) {
            if (e.binding.segment === 'static') {
                code = 'f.newVectorFrom(k)';        // TODO
            }
            else if (e.binding.segment === 'trace') {
                if (e.index === 0) {
                    code = 'f.newVectorFrom(r)';    // TODO
                }
                else if (e.index === 1) {
                    code = 'f.newVectorFrom(n)';    // TODO
                }
            }
        }

        if (e.isVector && options.vectorAsArray) {
            code = `${code}.toValues()`;
        }
        return code;
    }
}

// PUBLIC FUNCTIONS
// ================================================================================================
const generator = new ExpressionCodeGenerator();
export function toJsCode(e: Expression) {
    return generator.visit(e);
}