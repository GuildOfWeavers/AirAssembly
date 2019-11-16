// IMPORTS
// ================================================================================================
import { createPrimeField, FiniteField } from "@guildofweavers/galois";
import { AirModule, StarkLimits } from "@guildofweavers/air-assembly";
import { AirSchema } from '../AirSchema';
import { Procedure } from '../procedures';
import { getConstraintDegrees } from "../analysis";
import { StaticRegisters } from './registers';
import * as expressions from "./expressions";
import * as jsTemplate from './template';

// MODULE VARIABLES
// ================================================================================================
const procedureSignatures = {
    transition  : 'applyTransition(r, k)',
    evaluation  : 'evaluateConstraints(r, n, k)'
}

// PUBLIC FUNCTIONS
// ================================================================================================
export function instantiateModule(schema: AirSchema, limits: StarkLimits): AirModule {
    let code = `'use strict';\n\n`;

    // compute composition factor
    const constraintDegrees = getConstraintDegrees(schema);
    const maxConstraintDegree = constraintDegrees.reduce((p, c) => c > p ? c : p, 0);
    const compositionFactor = 2**Math.ceil(Math.log2(maxConstraintDegree));

    // set up module variables
    code += `const traceRegisterCount = ${schema.traceRegisterCount};\n`;
    code += `const constraintCount = ${schema.constraintCount};\n`;
    code += `const compositionFactor = ${compositionFactor};\n`;

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
     code += `staticRegisterCount: staticRegisters.size,\n`;
     //TODO: code += `constraints: constraints,\n`;
     code += `maxConstraintDegree: ${maxConstraintDegree},\n`;
     code += `initProof,\n`;
     code += `initVerification\n`;
     code += '};';

    // create and execute module builder function
    const buildModule = new Function('f', 'g', 'staticRegisters', code);
    return buildModule(
        buildField(schema),
        schema.constants.map(c => c.value),
        new StaticRegisters(schema.staticRegisters)
    );
}

// HELPER FUNCTIONS
// ================================================================================================
function generateProcedureCode(procedure: Procedure): string {
    let code = `\nfunction ${procedureSignatures[procedure.name]} {\n`;
    if (procedure.locals.length > 0) {
        code += 'let ' + procedure.locals.map((v, i) => `v${i}`).join(', ') + ';\n';
        code += procedure.subroutines.map(a => `v${a.localVarIdx} = ${expressions.toJsCode(a.expression)};\n`);
    }
    code += `return ${expressions.toJsCode(procedure.result)}.toValues();`; // TODO
    code += '\n}\n';
    return code;
}

function buildField(schema: AirSchema): FiniteField {
    // TODO: check type
    return createPrimeField(schema.field.modulus);
}