"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const procedures_1 = require("../procedures");
const expressions_1 = require("../expressions");
const LocalVariable_1 = require("../procedures/LocalVariable");
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
    const locals = procedure.locals.forEach(v => new LocalVariable_1.LocalVariable(v));
    procedure.replaceSubroutines(retainedSubroutines);
    return procedure;
}
exports.compressProcedure = compressProcedure;
// HELPER FUNCTIONS
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
//# sourceMappingURL=subroutines.js.map