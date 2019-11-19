"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const procedures_1 = require("../procedures");
const expressions_1 = require("../expressions");
// PROCEDURE COMPRESSOR
// ================================================================================================
function compressProcedure(procedure) {
    let expressions = [...procedure.subroutines.map(s => s.expression), procedure.result];
    const subroutineReferences = new Map();
    expressions.forEach(e => collectSubroutineReferences(e, subroutineReferences));
    const retainedSubroutines = [];
    for (let i = 0; i < procedure.subroutines.length; i++) {
        let subroutine = procedure.subroutines[i];
        let references = subroutineReferences.get(subroutine);
        if (!references)
            continue;
        if (references.length === 1) {
            let reference = references[0];
            procedure.transformExpressions(e => e === reference ? subroutine.expression : e, i + 1);
        }
        else {
            retainedSubroutines.push(subroutine);
        }
    }
    procedure.replaceSubroutines(retainedSubroutines);
    procedure = compressProcedure2(procedure);
    return procedure;
}
exports.compressProcedure = compressProcedure;
// EXPRESSION REPLACER
// ================================================================================================
function collectSubroutineReferences(e, result) {
    if (e instanceof expressions_1.LoadExpression) {
        if (!(e.binding instanceof procedures_1.Subroutine))
            return;
        const loads = result.get(e.binding) || [];
        loads.push(e);
        result.set(e.binding, loads);
    }
    else {
        for (let child of e.children) {
            collectSubroutineReferences(child, result);
        }
    }
}
// EXPRESSION COMPRESSOR
// ================================================================================================
class ExpressionCompressor extends expressions_1.ExpressionVisitor {
    // LITERALS
    // --------------------------------------------------------------------------------------------
    literalValue(e) {
        return e;
    }
    // OPERATIONS
    // --------------------------------------------------------------------------------------------
    binaryOperation(e) {
        const lhs = this.visit(e.lhs);
        const rhs = this.visit(e.rhs);
        return (e.lhs !== lhs || e.rhs !== rhs)
            ? new expressions_1.BinaryOperation(e.operation, lhs, rhs)
            : e;
    }
    unaryOperation(e) {
        const operand = this.visit(e.operand);
        return (e.operand !== operand)
            ? new expressions_1.UnaryOperation(e.operation, operand)
            : e;
    }
    // VECTORS AND MATRIXES
    // --------------------------------------------------------------------------------------------
    makeVector(e) {
        let elements = e.elements.map(e => this.visit(e));
        return new expressions_1.MakeVector(elements);
    }
    getVectorElement(e) {
        let source = this.visit(e.source);
        if (source instanceof expressions_1.MakeVector) {
            let element = source.getElementFor(e.index);
            if (element instanceof expressions_1.LiteralValue)
                return element;
        }
        return (e.source !== source)
            ? new expressions_1.GetVectorElement(source, e.index)
            : e;
    }
    sliceVector(e) {
        let source = this.visit(e.source);
        return new expressions_1.SliceVector(source, e.start, e.end);
    }
    makeMatrix(e) {
        return e;
    }
    // LOAD AND STORE
    // --------------------------------------------------------------------------------------------
    loadExpression(e) {
        return e;
    }
}
const compressor = new ExpressionCompressor();
function compressProcedure2(proc) {
    const result = new procedures_1.Procedure(proc.name, proc.span, proc.resultLength, proc.constants, proc.locals, proc.traceRegisters.dimensions[0], proc.staticRegisters.dimensions[0]);
    proc.subroutines.forEach(s => result.addSubroutine(compressor.visit(s.expression), s.localVarIdx));
    result.setResult(compressor.visit(proc.result));
    return result;
}
exports.compressProcedure2 = compressProcedure2;
// HELPER FUNCTIONS
// ================================================================================================
function isAdjacent(group, element) {
    if (group.length < 1)
        return false;
    const groupEnd = group[group.length - 1].end;
    return (element.start - 1) === groupEnd;
}
function compressGroup(elements, group) {
    if (group.length < 2)
        return;
    const firstElement = group[0], lastElement = group[group.length - 1];
    let i = elements.indexOf(firstElement);
    elements[i] = new expressions_1.SliceVector(firstElement.source, firstElement.start, lastElement.end);
    i++;
    for (let j = 1; j < group.length; j++, i++) {
        elements[i] = undefined;
    }
}
//# sourceMappingURL=compressor.js.map