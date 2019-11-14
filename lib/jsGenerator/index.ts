// IMPORTS
// ================================================================================================
import { AirSchema, AirModule } from "@guildofweavers/air-assembly";
import { InputRegister } from "../declarations";
import { InputProcessor } from "./inputs";
import * as expressions from "./expressions";
import * as jsTemplate from './template';

// PUBLIC FUNCTIONS
// ================================================================================================
export function generateModule(schema: AirSchema): AirModule {
    let code = `'use strict';\n\n`;

    // code += `const traceRegisterCount = ${schema.traceRegisterCount};\n`;

    // build transition function
    const tFunction = schema.transitionFunction;
    code += `\nfunction applyTransition(r, k) {\n`;
    if (tFunction.locals.length > 0) {
        code += 'let ' + tFunction.locals.map((v, i) => `v${i}`).join(', ') + ';\n';
        code += tFunction.assignments.map(a => `v${a.index} = ${expressions.toJsCode(a.value)};\n`);
    }
    code += expressions.toJsCode(tFunction.result);
    code += '\n}\n';

    // build constraint evaluator
    const cEvaluator = schema.constraintEvaluator;
    code += `\nfunction evaluateConstraints(r, k, n) {\n`;
    if (cEvaluator.locals.length > 0) {
        code += 'let ' + cEvaluator.locals.map((v, i) => `v${i}`).join(', ') + ';\n';
        code += cEvaluator.assignments.map(a => `v${a.index} = ${expressions.toJsCode(a.value)};\n`);
    }
    code += expressions.toJsCode(cEvaluator.result);
    code += '\n}\n';

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