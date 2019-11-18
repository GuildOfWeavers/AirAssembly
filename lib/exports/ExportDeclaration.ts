// IMPORTS
// ================================================================================================
import { LiteralValue } from "../expressions";

// CLASS DECLARATION
// ================================================================================================
export class ExportDeclaration {

    readonly name           : string;
    readonly cycleLength    : number;
    readonly initializer?   : LiteralValue | 'seed';

    constructor(name: string, cycleLength: number, initializer?: LiteralValue | 'seed') {
        this.name = validateName(name);
        this.cycleLength = cycleLength;
        this.initializer = initializer;
    }

    get isMain(): boolean {
        return this.name === 'main';
    }

    toString(): string {
        const name = this.isMain ? this.name : `"${this.name}"`;
        let initializer = '';
        if (this.initializer === 'seed') {
            initializer = ` (init seed)`;
        }
        else if (this.initializer !== undefined) {
            initializer = ` (init ${this.initializer.toString()})`;
        }
        return `(export ${name}${initializer} (steps ${this.cycleLength}))`;
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function validateName(value: string): string {
    // TODO
    return value;
}