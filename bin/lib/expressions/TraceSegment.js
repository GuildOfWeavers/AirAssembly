"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const Expression_1 = require("./Expression");
const utils_1 = require("./utils");
// CLASS DEFINITION
// ================================================================================================
class TraceSegment extends Expression_1.Expression {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(width, isStatic) {
        super(utils_1.Dimensions.vector(width));
        this.isStatic = isStatic;
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get segment() {
        return this.isStatic ? 'static' : 'trace';
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        return this.segment;
    }
}
exports.TraceSegment = TraceSegment;
//# sourceMappingURL=TraceSegment.js.map