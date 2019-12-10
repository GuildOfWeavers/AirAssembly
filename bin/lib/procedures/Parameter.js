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
        if (utils_1.Dimensions.isScalar(this.dimensions))
            return `(param${handle}scalar)`;
        else if (utils_1.Dimensions.isVector(this.dimensions))
            return `(param${handle}vector ${this.dimensions[0]})`;
        else
            return `(param${handle}matrix ${this.dimensions[0]} ${this.dimensions[1]})`;
    }
}
exports.Parameter = Parameter;
//# sourceMappingURL=Parameter.js.map