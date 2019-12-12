// IMPORTS
// ================================================================================================
import { AirProcedure as IProcedure, ProcedureName} from '@guildofweavers/air-assembly';
import { ProcedureContext } from './contexts/ProcedureContext';
import { Expression, TraceSegment } from "../expressions";
import { LocalVariable } from "./LocalVariable";
import { StoreOperation } from './StoreOperation';
import { Dimensions } from "../expressions/utils";
import { Constant } from './Constant';

// CLASS DEFINITION
// ================================================================================================
export class AirProcedure implements IProcedure {

    readonly name               : ProcedureName;
    readonly span               : number;
    readonly localVariables     : LocalVariable[];

    readonly statements         : StoreOperation[];
    readonly result             : Expression;

    readonly constants          : Constant[];
    readonly traceRegisters     : TraceSegment;
    readonly staticRegisters    : TraceSegment;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(context: ProcedureContext, statements: StoreOperation[], result: Expression) {
        this.name = context.name;
        this.span = validateSpan(this.name, context.span);
        this.localVariables = context.locals.slice();
        this.statements = statements.slice();
        if (!result.isVector || result.dimensions[0] !== context.width)
            throw new Error(`${this.name} procedure must resolve to a vector of ${context.width} elements`);
        this.result = result;
        this.constants = context.constants;
        this.traceRegisters = context.traceRegisters;
        this.staticRegisters = context.staticRegisters;
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get dimensions(): Dimensions {
        return this.result.dimensions;
    }

    get locals(): ReadonlyArray<Dimensions> {
        return this.localVariables.map(v => v.dimensions);
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        let code = `\n    (span ${this.span}) (result ${Dimensions.toTypeString(this.dimensions)})`;
        if (this.localVariables.length > 0)
            code += `\n    ${this.localVariables.map(v => v.toString()).join(' ')}`;
        if (this.statements.length > 0)
            code += `\n    ${this.statements.map(s => s.toString()).join('\n    ')}`;
        code += `\n    ${this.result.toString()}`
        return `\n  (${this.name}${code})`;
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function validateSpan(name: ProcedureName, span: number): number {
    if (name === 'transition') {
        if (span !== 1) throw new Error(`span ${span} is not valid for ${name} procedure`);
    }
    else if (name === 'evaluation') {
        if (span !== 2) throw new Error(`span ${span} is not valid for ${name} procedure`);
    }
    else {
        throw new Error(`invalid procedure name '${name}'`);
    }
    return span;
}

/*
    // MUTATION METHODS
    // --------------------------------------------------------------------------------------------
    transformExpressions(transformer: ExpressionTransformer, subIdx: number): void {
        for (let i = subIdx; i < this.subroutines.length; i++) {
            this.subroutines[i].transformExpression(transformer);
        }
    
        let result = transformer(this.result);
        if (this.result !== result) {
            this._result = result;
        }
        else {
            result.transform(transformer);
        }
    }

    replaceSubroutines(subroutines: Subroutine[]): void {
        // TODO: replace subroutines in a different way
        this.subroutines.length = 0;
        subroutines.forEach(s => this.subroutines.push(s));

        this.localVariables.forEach(v => v.clearBinding());
        this.subroutines.forEach(s => this.localVariables[s.localVarIdx].bind(s, s.localVarIdx));
    
        let shiftCount = 0;
        for (let i = 0; i < this.localVariables.length; i++) {
            let variable = this.localVariables[i];
            if (!variable.isBound) {
                this.localVariables.splice(i, 1);
                shiftCount++;
                i--;
            }
            else if (shiftCount > 0) {
                let fromIdx = i + shiftCount;
                this.transformExpressions(e => {
                    if (e instanceof LoadExpression && e.binding instanceof Subroutine && e.index === fromIdx) {
                        return new LoadExpression(e.binding, i);
                    }
                    return e;
                }, 0);
                this.subroutines.forEach(s => s.updateIndex(fromIdx, i));
            }
        }
    }
*/