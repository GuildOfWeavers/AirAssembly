"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../expressions/utils");
// CLASS DEFINITION
// ================================================================================================
class AirFunction {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(width, context) {
        this.dimensions = utils_1.Dimensions.vector(width);
        this.context = context;
        this.assignments = [];
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get result() {
        return this._result; // TODO
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    addAssignment() {
        // TODO
    }
    toString() {
        return ''; // TODO
    }
}
exports.AirFunction = AirFunction;
//# sourceMappingURL=AirFunction.js.map