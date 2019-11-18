"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const galois_1 = require("@guildofweavers/galois");
const registers_1 = require("./registers");
const expressions = require("./expressions");
const jsTemplate = require("./template");
const utils_1 = require("../utils");
// MODULE VARIABLES
// ================================================================================================
const procedureSignatures = {
    transition: 'applyTransition(r, k)',
    evaluation: 'evaluateConstraints(r, n, k)'
};
// PUBLIC FUNCTIONS
// ================================================================================================
function instantiateModule(schema, options) {
    let code = `'use strict';\n\n`;
    // set up module variables
    code += `const traceRegisterCount = ${schema.traceRegisterCount};\n`;
    code += `const extensionFactor = ${options.extensionFactor};\n`;
    code += `const compositionFactor = ${utils_1.getCompositionFactor(schema)};\n`;
    // build transition function and constraint evaluator
    code += generateProcedureCode(schema.transitionFunction);
    code += generateProcedureCode(schema.constraintEvaluator);
    // add functions from the template
    for (let prop in jsTemplate) {
        code += `${jsTemplate[prop].toString()}\n`;
    }
    code += '\n';
    // build return object
    code += 'return {\n';
    code += `field: f,\n`;
    code += `traceRegisterCount: traceRegisterCount,\n`;
    code += `staticRegisterCount: staticRegisters.size,\n`;
    code += `inputDescriptors: staticRegisters.inputDescriptors,\n`;
    code += `constraints: constraints,\n`;
    code += `maxConstraintDegree: ${schema.maxConstraintDegree},\n`;
    code += `extensionFactor: extensionFactor,\n`;
    code += `initProof,\n`;
    code += `initVerification\n`;
    code += '};';
    // create and execute module builder function
    const buildModule = new Function('f', 'g', 'constraints', 'staticRegisters', code);
    return buildModule(buildField(schema.field, options.wasmOptions), schema.constants.map(c => c.value), schema.constraints, new registers_1.StaticRegisters(schema.staticRegisters));
}
exports.instantiateModule = instantiateModule;
// HELPER FUNCTIONS
// ================================================================================================
function generateProcedureCode(procedure) {
    let code = `\nfunction ${procedureSignatures[procedure.name]} {\n`;
    if (procedure.locals.length > 0) {
        code += 'let ' + procedure.locals.map((v, i) => `v${i}`).join(', ') + ';\n';
        code += procedure.subroutines.map(a => `v${a.localVarIdx} = ${expressions.toJsCode(a.expression)};\n`);
    }
    code += `return ${expressions.toJsCode(procedure.result)}.toValues();`; // TODO
    code += '\n}\n';
    return code;
}
function buildField(field, wasmOptions) {
    if (field.type === 'prime') {
        // needed for type checking to work
        return (typeof wasmOptions === 'boolean')
            ? galois_1.createPrimeField(field.modulus, wasmOptions)
            : galois_1.createPrimeField(field.modulus, wasmOptions);
    }
    else {
        throw new Error(`field type '${field.type}' is not supported`);
    }
}
//# sourceMappingURL=index.js.map