"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class ExpressionVisitor {
    constructor() {
        this.handlers = new Map();
        for (let prop of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
            let member = this[prop];
            if (typeof member !== `function` || prop === 'constructor')
                continue;
            this.handlers.set(prop.toLocaleLowerCase(), member);
            // TODO: check for duplicated names
        }
    }
    visit(expression, options) {
        if (!expression)
            throw new TypeError('expression is undefined');
        const eName = expression.constructor.name;
        const handler = this.handlers.get(eName.toLowerCase());
        if (!handler)
            throw new Error(`handler for '${eName}' expression could not be found`);
        return handler.call(this, expression, options);
    }
}
exports.ExpressionVisitor = ExpressionVisitor;
//# sourceMappingURL=ExpressionVisitor.js.map