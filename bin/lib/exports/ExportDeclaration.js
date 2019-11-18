"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DECLARATION
// ================================================================================================
class ExportDeclaration {
    constructor(name, cycleLength, initializer) {
        this.name = validateName(name);
        this.cycleLength = cycleLength;
        this.initializer = initializer;
    }
    get isMain() {
        return this.name === 'main';
    }
    toString() {
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
exports.ExportDeclaration = ExportDeclaration;
// HELPER FUNCTIONS
// ================================================================================================
function validateName(value) {
    // TODO
    return value;
}
//# sourceMappingURL=ExportDeclaration.js.map