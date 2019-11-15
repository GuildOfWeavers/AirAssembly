"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const galois_1 = require("@guildofweavers/galois");
const registers_1 = require("./registers");
const expressions = require("./expressions");
const jsTemplate = require("./template");
// MODULE VARIABLES
// ================================================================================================
const procedureSignatures = {
    transition: 'applyTransition(r, k)',
    evaluation: 'evaluateConstraints(r, k, n)'
};
// PUBLIC FUNCTIONS
// ================================================================================================
function generateModule(schema) {
    let code = `'use strict';\n\n`;
    code += `const traceRegisterCount = ${schema.transitionFunction.resultLength};\n`;
    code += `const compositionFactor = 4;\n`; // TODO
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
    // TODO: code += `kRegisterCount: ${specs.staticRegisters.length},\n`;
    // TODO: code += `constraints: constraints,\n`;
    // TODO: code += `maxConstraintDegree: ${specs.maxTransitionConstraintDegree},\n`;
    code += `initProof,\n`;
    code += `initVerification\n`;
    code += '};';
    // create and execute module builder function
    const buildModule = new Function('f', 'g', 'staticRegisters', code);
    return buildModule(buildField(schema), schema.constants.map(c => c.value), new registers_1.StaticRegisters(schema.staticRegisters));
}
exports.generateModule = generateModule;
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
function buildField(schema) {
    // TODO: check type
    return galois_1.createPrimeField(schema.field.modulus);
}
function buildCyclicRegisters(schema) {
    return [];
    /*
    return schema.staticRegisters.cyclic.map(r => ({
        type    : 'cyclic',
        shape   : [1, r.values.length], // TODO: remove?
        values  : r.values,
        secret  : false,
    }));
    */
}
//# sourceMappingURL=index.js.map