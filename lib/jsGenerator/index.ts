// IMPORTS
// ================================================================================================
import { createPrimeField, FiniteField, WasmOptions } from "@guildofweavers/galois";
import { AirModule, ModuleOptions, FieldDescriptor } from "@guildofweavers/air-assembly";
import { AirSchema } from '../AirSchema';
import { Procedure } from '../procedures';
import { StaticRegister, InputRegister, CyclicRegister, MaskRegister } from "../registers";
import { getCompositionFactor } from "../utils";
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
export function instantiateModule(schema: AirSchema, options: ModuleOptions): AirModule {
    let code = `'use strict';\n\n`;

    // set up module variables
    code += `const traceRegisterCount = ${schema.traceRegisterCount};\n`;
    code += `const extensionFactor = ${options.extensionFactor};\n`;
    code += `const compositionFactor = ${getCompositionFactor(schema)};\n`;

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
    code += `staticRegisterCount: ${schema.staticRegisterCount},\n`;
    code += `inputDescriptors: staticRegisters.inputs,\n`
    code += `constraints: constraints,\n`;
    code += `maxConstraintDegree: ${schema.maxConstraintDegree},\n`;
    code += `extensionFactor: extensionFactor,\n`;
    code += `initProof,\n`;
    code += `initVerification\n`;
    code += '};';

    // create and execute module builder function
    const buildModule = new Function('f', 'g', 'constraints', 'staticRegisters', code);
    return buildModule(
        buildField(schema.field, options.wasmOptions),
        schema.constants.map(c => c.value),
        schema.constraints,
        buildStaticRegisters(schema.staticRegisters)
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
    code += `return ${expressions.toJsCode(procedure.result, { vectorAsArray: true })};`;
    code += '\n}\n';
    return code;
}

function buildField(field: FieldDescriptor, wasmOptions?: Partial<WasmOptions> | boolean): FiniteField {
    if (field.type === 'prime') {
        // needed for type checking to work
        return (typeof wasmOptions === 'boolean')
            ? createPrimeField(field.modulus, wasmOptions)
            : createPrimeField(field.modulus, wasmOptions);
    }
    else {
        throw new Error(`field type '${field.type}' is not supported`);
    }
}

function buildStaticRegisters(registers: ReadonlyArray<StaticRegister>) {
    const inputs = [], cyclic = [], masked = [];

    for (let register of registers) {
        if (register instanceof InputRegister) {
            inputs.push({
                rank    : register.rank,
                parent  : register.parent,
                secret  : register.secret,
                binary  : register.binary,
                steps   : register.steps
            });
        }
        else if (register instanceof CyclicRegister) {
            cyclic.push({ type: 'cyclic', values: register.values, secret: false });
        }
        else if (register instanceof MaskRegister) {
            masked.push({ source: register.source, value: register.value });
        }
    }

    return { inputs, cyclic, masked };
}