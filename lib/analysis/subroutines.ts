// IMPORTS
// ================================================================================================
import { Procedure, Subroutine } from "../procedures";
import { Expression, LoadExpression } from "../expressions";
import { LocalVariable } from "../procedures/LocalVariable";

// PROCEDURE COMPRESSOR
// ================================================================================================
export function compressProcedure(procedure: Procedure): Procedure {

    let expressions = [...procedure.subroutines.map(s => s.expression), procedure.result];
    const subroutineReferences = new Map<Subroutine, LoadExpression[]>();
    expressions.forEach(e => collectSubroutineReferences(e, subroutineReferences));

    const retainedSubroutines: Subroutine[] = [];
    for (let i = 0; i < procedure.subroutines.length; i++) {
        let subroutine = procedure.subroutines[i];
        let references = subroutineReferences.get(subroutine);
        if (!references) continue;
        if (references.length === 1) {
            let reference = references[0];
            procedure.transformExpressions(e => e === reference ? subroutine.expression : e, i + 1);
        }
        else {
            retainedSubroutines.push(subroutine);
        }
    }

    const locals = procedure.locals.forEach(v => new LocalVariable(v));

    procedure.replaceSubroutines(retainedSubroutines);

    return procedure;
}

// HELPER FUNCTIONS
// ================================================================================================
function collectSubroutineReferences(e: Expression, result: Map<Subroutine, LoadExpression[]>): void {
    if (e instanceof LoadExpression) {
        if (!(e.binding instanceof Subroutine)) return;
        const loads = result.get(e.binding) || [];
        loads.push(e)
        result.set(e.binding, loads);
    }
    else {
        for (let child of e.children) {
            collectSubroutineReferences(child, result);
        }
    }
}