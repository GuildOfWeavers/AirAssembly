// IMPORTS
// ================================================================================================
import { Expression } from "./Expression";

// INTERFACES
// ================================================================================================
interface ExpressionHandler<T> {
    (expression: Expression, options?: any): T;
}

// CLASS DEFINITION
// ================================================================================================
export class ExpressionVisitor<T> {

    readonly handlers: Map<string, ExpressionHandler<T>>;

    constructor() {
        this.handlers = new Map();
        for (let prop of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
            let member = (this as any)[prop];
            if (typeof member !== `function` || prop === 'constructor') continue;
            const handlerName = prop.toLowerCase();
            if (this.handlers.has(handlerName))
                throw new Error(`expression handler '${handlerName}' is defined more than once`);
            this.handlers.set(handlerName, member);
        }
    }

    visit(expression: Expression, options?: any): T {
        if (!expression) throw new TypeError('expression is undefined');
        const eName = expression.constructor.name;
        const handler = this.handlers.get(eName.toLowerCase());
        if (!handler) throw new Error(`handler for '${eName}' expression could not be found`);
        return handler.call(this, expression, options);
    }    
}