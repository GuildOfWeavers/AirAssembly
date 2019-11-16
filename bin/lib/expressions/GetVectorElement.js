"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const Expression_1 = require("./Expression");
const utils_1 = require("./utils");
// CLASS DEFINITION
// ================================================================================================
class GetVectorElement extends Expression_1.Expression {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(source, index) {
        if (source.isScalar)
            throw new Error('cannot extract element from a scalar value');
        if (source.isMatrix)
            throw new Error('cannot extract element from a matrix value');
        const sourceLength = source.dimensions[0];
        if (index < 0 || index >= sourceLength) {
            throw new Error(`vector index ${index} is out of bounds; expected to be within [${0}, ${sourceLength})`);
        }
        super(utils_1.Dimensions.scalar(), [source]);
        this.index = index;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get source() { return this.children[0]; }
    get start() { return this.index; }
    get end() { return this.index; }
    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    toString() {
        return `(get ${this.source.toString()} ${this.index})`;
    }
}
exports.GetVectorElement = GetVectorElement;
//# sourceMappingURL=GetVectorElement.js.map