// IMPORTS
// ================================================================================================
import { TraceInitializer } from "@guildofweavers/air-assembly";
import { LiteralValue } from "../expressions";
import { isPowerOf2 } from "../utils";

// CONSTANTS
// ================================================================================================
const MAX_NAME_LENGTH = 128;
const NAME_REGEXP = /[a-zA-Z]\w*/g;

// CLASS DECLARATION
// ================================================================================================
export class ExportDeclaration {

    readonly name           : string;
    readonly cycleLength    : number;
    readonly initializer?   : TraceInitializer;
    readonly seed?          : bigint[];

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(name: string, cycleLength: number, initializer?: LiteralValue | 'seed') {
        this.name = validateName(name);
        this.cycleLength = validateCycleLength(cycleLength, this.name);
        if (name === 'main') {
            if (!initializer)
                throw new Error(`no initializer provided for main export`);
    
            if (initializer instanceof LiteralValue) {
                if (!initializer.isVector) throw new Error(`initializer for main export must resolve to a vector`);
                const seedValue = initializer.value as bigint[];
                this.initializer = () => seedValue;
                this.seed = seedValue;
            }
            else {
                this.initializer = (seed) => {
                    if (!seed) throw new Error(`field to initialize execution trace: seed is undefined`);
                    if (!Array.isArray(seed)) throw new Error(`failed to initialize execution trace: seed is not an array`);
                    return seed;
                };
            }
        }
        else if (initializer) {
            throw new Error(`'${name}' export declaration is invalid: initializer can be provided only for main exports`);
        }
    }

    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get isMain(): boolean {
        return this.name === 'main';
    }

    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString(): string {
        let initializer = '';
        if (this.initializer !== undefined) {
            initializer = (this.seed)
                ? ` (init (vector ${this.seed.join(' ')}))`
                : ` (init seed)`;
        }
        return `(export ${this.name}${initializer} (steps ${this.cycleLength}))`;
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function validateName(value: string): string {
    if (value.length > MAX_NAME_LENGTH)
        throw new Error(`export name '${value}' is invalid: name length cannot exceed ${MAX_NAME_LENGTH} characters`);
    const matches = value.match(NAME_REGEXP);
    if (matches === null || matches.length > 1)
        throw new Error(`export name '${value}' is invalid`);
    return value;
}

function validateCycleLength(value: number, name: string): number {
    if (!Number.isInteger(value))
        throw new Error(`trace cycle length for export '${name}' is invalid: cycle length must be an integer`);
    if (value < 1)
        throw new Error(`trace cycle length for export '${name}' is invalid: cycle length must be greater than 1`);
    if (!isPowerOf2(value))
        throw new Error(`trace cycle length for export '${name}' is invalid: cycle length must be a power of 2`);
    return value;
}