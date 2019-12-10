// IMPORTS
// ================================================================================================
import { LoadSource } from "@guildofweavers/air-assembly";
import { Parameter } from "./Parameter";
import { LocalVariable } from "./LocalVariable";
import { LoadExpression } from "../expressions";
import { getLoadSource } from "../expressions/utils";

// CLASS DEFINITION
// ================================================================================================
export class ExecutionContext {

    readonly parameters     : Parameter[];
    readonly locals         : LocalVariable[];

    readonly groups         : Map<string, any[]>;
    readonly declarations   : Map<string, any>;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(groups: LoadSource[]) {
        this.parameters = [];
        this.locals = [];
        this.declarations = new Map();
        this.groups = new Map();
        groups.forEach(g => this.groups.set(g, []));
    }

    // COLLECTION METHODS
    // --------------------------------------------------------------------------------------------
    add(value: Parameter | LocalVariable): void {
        if (value instanceof Parameter) {
            if (value.handle) {
                this.validateDeclaration('param', value.handle);
                this.declarations.set(`param::${value.handle}`, value);
            }
            this.declarations.set(`param::${this.parameters.length}`, value);
            this.parameters.push(value);
        }
        else if (value instanceof LocalVariable) {
            this.declarations.set(`local::${this.locals.length}`, value);
            this.locals.push(value);
        }
    }

    get(group: 'param', indexOrHandle: number | string): Parameter
    get(group: 'local', indexOrHandle: number | string): LocalVariable
    get(group: LoadSource, indexOrHandle: number | string): any {
        const result = this.declarations.get(`${group}::${indexOrHandle}`);
        if (!result) {
            // TODO: throw error
        }
        return result;
    }

    has(group: string, indexOrHandle: number | string): boolean {
        return this.declarations.has(`${group}::${indexOrHandle}`);
    }

    toArray(group: 'param'): Parameter[];
    toArray(group: 'local'): LocalVariable[];
    toArray(group: LoadSource): any[] {
        return this.groups.get(group)!;
    }

    // OTHER PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    buildLoadExpression(operation: string, indexOrHandle: number | string): LoadExpression {
        const source = getLoadSource(operation);
        if (source === 'local') {
            const variable = this.get(source, indexOrHandle);
            const binding = variable.getBinding(0); // TODO
            return new LoadExpression(binding, this.locals.indexOf(variable));
        }
        // TODO: param source
        else {
            throw new Error(`${operation} is not a valid load operation`);
        }
    }

    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    private validateDeclaration(group: LoadSource, handle: string) {
        if (this.has(group, handle)) {
            if (group === 'param') {
                throw Error(`parameter with handle '${handle}' has already been declared`);
            }
            else if (group === 'local') {
                throw Error(`local variable with handle '${handle}' has already been declared`);
            }
        }
    }
}
