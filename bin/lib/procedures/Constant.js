"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
// CLASS DEFINITION
// ================================================================================================
class Constant {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(value, handle) {
        this.value = value;
        if (handle !== undefined) {
            this.handle = utils_1.validateHandle(handle);
        }
    }
    // ACCESSORS
    // --------------------------------------------------------------------------------------------
    get dimensions() {
        return this.value.dimensions;
    }
    // PUBLIC METHODS
    // --------------------------------------------------------------------------------------------
    toString() {
        return this.value.toString();
    }
}
exports.Constant = Constant;
//# sourceMappingURL=Constant.js.map