"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const galois_1 = require("@guildofweavers/galois");
const analysis_1 = require("../analysis");
const registers_1 = require("./registers");
const expressions = require("./expressions");
const jsTemplate = require("./template");
// MODULE VARIABLES
// ================================================================================================
const procedureSignatures = {
    transition: 'applyTransition(r, k)',
    evaluation: 'evaluateConstraints(r, n, k)'
};
// PUBLIC FUNCTIONS
// ================================================================================================
function instantiateModule(schema, limits) {
    let code = `'use strict';\n\n`;
    // compute composition factor
    const constraintDegrees = analysis_1.getConstraintDegrees(schema);
    const maxConstraintDegree = constraintDegrees.reduce((p, c) => c > p ? c : p, 0);
    const compositionFactor = 2 ** Math.ceil(Math.log2(maxConstraintDegree));
    // set up module variables
    code += `const traceRegisterCount = ${schema.traceRegisterCount};\n`;
    code += `const constraintCount = ${schema.constraintCount};\n`;
    code += `const compositionFactor = ${compositionFactor};\n`;
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
    //TODO: code += `constraints: constraints,\n`;
    code += `maxConstraintDegree: ${maxConstraintDegree},\n`;
    code += `initProof,\n`;
    code += `initVerification\n`;
    code += '};';
    // create and execute module builder function
    const buildModule = new Function('f', 'g', 'staticRegisters', code);
    return buildModule(buildField(schema), schema.constants.map(c => c.value), new registers_1.StaticRegisters(schema.staticRegisters));
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
function buildField(schema) {
    // TODO: check type
    return galois_1.createPrimeField(schema.field.modulus);
}
//# sourceMappingURL=index.js.map