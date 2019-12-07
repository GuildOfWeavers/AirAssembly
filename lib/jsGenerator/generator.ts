// IMPORTS
// ================================================================================================
import { createPrimeField, FiniteField, WasmOptions, Vector, Matrix } from "@guildofweavers/galois";
import { AirModule, AirModuleOptions, InputDescriptor, MaskRegisterDescriptor, RegisterEvaluatorSpecs } from "@guildofweavers/air-assembly";
import { AirSchema } from '../AirSchema';
import { Procedure } from '../procedures';
import { InputRegister, CyclicRegister, MaskRegister } from "../registers";
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
export function instantiateModule(schema: AirSchema, options: AirModuleOptions): AirModule {
    let code = `'use strict';\n\n`;

    const mainExport = schema.exports.get('main');
    if (!mainExport)
        throw new Error(`cannot instantiate module: main export is undefined`);

    // set up module variables
    code += `const traceCycleLength = ${mainExport.cycleLength};\n`;
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
    code += `inputDescriptors: staticRegisters.inputs,\n`;
    code += `secretInputCount: ${schema.secretInputCount},\n`;
    code += `constraints: constraints,\n`;
    code += `maxConstraintDegree: ${schema.maxConstraintDegree},\n`;
    code += `extensionFactor: extensionFactor,\n`;
    code += `createProver,\n`;
    code += `createVerifier\n`;
    code += '};';

    // create and execute module builder function
    const field = buildField(schema, options.wasmOptions);
    const buildModule = new Function('f', 'g', 'constraints', 'staticRegisters', 'initializeTrace', code);
    return buildModule(
        field,
        buildConstants(schema, field),
        schema.constraints,
        buildStaticRegisters(schema),
        mainExport.initializer
    );
}

// HELPER FUNCTIONS
// ================================================================================================
function generateProcedureCode(procedure: Procedure): string {
    let code = `\nfunction ${procedureSignatures[procedure.name]} {\n`;
    if (procedure.locals.length > 0) {
        code += 'let ' + procedure.locals.map((v, i) => `v${i}`).join(', ') + ';\n';
        code += procedure.subroutines.map(a => `v${a.localVarIdx} = ${expressions.toJsCode(a.expression)};`).join('\n');
        code += '\n';
    }
    code += `return ${expressions.toJsCode(procedure.result, { vectorAsArray: true })};`;
    code += '\n}\n';
    return code;
}

function buildField(schema: AirSchema, wasmOptions?: Partial<WasmOptions> | boolean): FiniteField {
    if (schema.field.extensionDegree === 1) {
        // needed for type checking to work
        return (typeof wasmOptions === 'boolean')
            ? createPrimeField(schema.field.characteristic, wasmOptions)
            : createPrimeField(schema.field.characteristic, wasmOptions);
    }
    else {
        throw new Error('non-prime fields are not supported');
    }
}

function buildConstants(schema: AirSchema, field: FiniteField): (bigint | Vector | Matrix)[] {
    return schema.constants.map(c => {
        if (c.isScalar) return c.value as bigint;
        else if (c.isVector) return field.newVectorFrom(c.value as bigint[]);
        else return field.newMatrixFrom(c.value as bigint[][]);
    });
}

function buildStaticRegisters(schema: AirSchema) {
    const inputs: InputDescriptor[] = [];
    const masked: MaskRegisterDescriptor[] = [];
    const cyclic: RegisterEvaluatorSpecs[] = [];

    for (let register of schema.staticRegisters) {
        if (register instanceof InputRegister) {
            inputs.push({
                rank    : register.rank,
                parent  : register.parent,
                secret  : register.secret,
                binary  : register.binary,
                offset  : register.offset,
                steps   : register.steps
            });
        }
        else if (register instanceof MaskRegister) {
            masked.push({ source: register.source, inverted: register.inverted });
        }
        else if (register instanceof CyclicRegister) {
            cyclic.push({ cyclic: true, values: register.getValues(schema.field) });
        }
    }

    return { inputs, masked, cyclic };
}