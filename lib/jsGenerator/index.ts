// IMPORTS
// ================================================================================================
import { AirSchema, AirModule, Procedure } from "@guildofweavers/air-assembly";
import { InputRegister } from "../registers";
import { InputProcessor } from "./inputs";
import * as expressions from "./expressions";
import * as jsTemplate from './template';

// MODULE VARIABLES
// ================================================================================================
const procedureSignatures = {
    transition  : 'applyTransition(r, k)',
    evaluation  : 'evaluateConstraints(r, k, n)'
}

// PUBLIC FUNCTIONS
// ================================================================================================
export function generateModule(schema: AirSchema): AirModule {
    let code = `'use strict';\n\n`;

    // code += `const traceRegisterCount = ${schema.traceRegisterCount};\n`;

    // build transition function and constraint evaluator
    code += generateProcedureCode(schema.transitionFunction);
    code += generateProcedureCode(schema.constraintEvaluator);

    // add functions from the template
    for (let prop in jsTemplate) {
        code += `${(jsTemplate as any)[prop].toString()}\n`;
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

    const inputProcessor = new InputProcessor(buildInputRegisters(schema));

    // create and execute module builder function
    const buildModule = new Function('f', 'g', 'inputProcessor', code);
    return buildModule(
        // TODO
        inputProcessor
    );
}

// HELPER FUNCTIONS
// ================================================================================================
function buildInputRegisters(schema: AirSchema): InputRegister[] {
    return []; // TODO
    //return schema.staticRegisters.filter(r => r instanceof InputRegister);
}

function generateProcedureCode(procedure: Procedure): string {
    let code = `\nfunction ${procedureSignatures[procedure.name]} {\n`;
    if (procedure.locals.length > 0) {
        code += 'let ' + procedure.locals.map((v, i) => `v${i}`).join(', ') + ';\n';
        code += procedure.subroutines.map(a => `v${a.localVarIdx} = ${expressions.toJsCode(a.expression)};\n`);
    }
    code += expressions.toJsCode(procedure.result);
    code += '\n}\n';
    return code;
}