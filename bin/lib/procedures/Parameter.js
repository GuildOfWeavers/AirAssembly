"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const utils_1 = require("../expressions/utils");
const utils_2 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class Parameter {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(dimensions, handle) {
        this.dimensions = dimensions;
        if (handle !== undefined) {
            this.handle = utils_2.validateHandle(handle);
        }
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        const handle = this.handle ? ` ${this.handle} ` : ' ';
        return `(param${handle}${utils_1.Dimensions.toExpressionString(this.dimensions)})`;
    }
}
exports.Parameter = Parameter;
//# sourceMappingURL=Parameter.js.map