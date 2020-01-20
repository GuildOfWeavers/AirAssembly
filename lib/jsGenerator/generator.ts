// IMPORTS
// ================================================================================================
import { createPrimeField, FiniteField, WasmOptions, Vector, Matrix } from "@guildofweavers/galois";
import {
    AirModule, AirModuleOptions, InputDescriptor, MaskRegisterDescriptor, RegisterEvaluatorSpecs
} from "@guildofweavers/air-assembly";
import { AirComponent } from "../AirComponent";
import { AirProcedure, AirFunction } from '../procedures';
import { InputRegister, CyclicRegister, MaskRegister } from "../registers";
import { getCompositionFactor } from "../utils";
import * as expressions from "./expressions";
import * as jsTemplate from './template';

// MODULE VARIABLES
// ================================================================================================
const procedureSignatures = {
    init        : `initializeTrace(k, p0)`,
    transition  : 'applyTransition(r, k)',
    evaluation  : 'evaluateConstraints(r, n, k)'
}

// PUBLIC FUNCTIONS
// ================================================================================================
export function instantiateModule(component: AirComponent, options: AirModuleOptions): AirModule {
    let code = `'use strict';\n\n`;

    // set up module variables
    code += `const traceCycleLength = ${component.cycleLength};\n`;
    code += `const traceRegisterCount = ${component.traceRegisterCount};\n`;
    code += `const extensionFactor = ${options.extensionFactor};\n`;
    code += `const compositionFactor = ${getCompositionFactor(component)};\n`;

    // build supporting functions
    code += '\n';
    code += component.functions.map((func, i) => generateFunctionCode(func, i)).join('\n');

    // build trace initializer, transition function, and constraint evaluator
    code += '\n';
    code += `${generateProcedureCode(component.traceInitializer)}\n`;
    code += `${generateProcedureCode(component.transitionFunction)}\n`;
    code += `${generateProcedureCode(component.constraintEvaluator)}\n`;

    // add functions from the template
    for (let prop in jsTemplate) {
        code += `${(jsTemplate as any)[prop].toString()}\n`;
    }
    code += '\n';

    // build return object
    code += 'return {\n';
    code += `field: f,\n`;
    code += `traceRegisterCount: traceRegisterCount,\n`;
    code += `staticRegisterCount: ${component.staticRegisterCount},\n`;
    code += `inputDescriptors: staticRegisters.inputs,\n`;
    code += `secretInputCount: ${component.secretInputCount},\n`;
    code += `constraints: constraints,\n`;
    code += `maxConstraintDegree: ${component.maxConstraintDegree},\n`;
    code += `extensionFactor: extensionFactor,\n`;
    code += `initProvingContext,\n`;
    code += `initVerificationContext\n`;
    code += '};';

    // create and execute module builder function
    const field = buildField(component, options.wasmOptions);
    const buildModule = new Function('f', 'g', 'constraints', 'staticRegisters', code);
    return buildModule(
        field,
        buildConstants(component, field),
        component.constraints,
        buildStaticRegisters(component)
    );
}

// HELPER FUNCTIONS
// ================================================================================================
function generateProcedureCode(procedure: AirProcedure): string {
    let code = `function ${procedureSignatures[procedure.name]} {\n`;
    if (procedure.locals.length > 0) {
        code += 'let ' + procedure.locals.map((v, i) => `v${i}`).join(', ') + ';\n';
        code += procedure.statements.map(a => `v${a.target} = ${expressions.toJsCode(a.expression)};`).join('\n');
        code += '\n';
    }
    code += `return ${expressions.toJsCode(procedure.result, { vectorAsArray: true })};`;
    code += '\n}\n';
    return code;
}

function generateFunctionCode(func: AirFunction, index: number): string {
    let code = `function func${index}(${func.params.map((p, i) => `p${i}`).join(', ')}) {\n`;
    if (func.locals.length > 0) {
        code += 'let ' + func.locals.map((v, i) => `v${i}`).join(', ') + ';\n';
        code += func.statements.map(a => `v${a.target} = ${expressions.toJsCode(a.expression)};`).join('\n');
        code += '\n';
    }
    code += `return ${expressions.toJsCode(func.result)};`
    code += '\n}\n';
    return code;
}

function buildField(component: AirComponent, wasmOptions?: Partial<WasmOptions> | boolean): FiniteField {
    if (component.field.extensionDegree === 1) {
        // needed for type checking to work
        return (typeof wasmOptions === 'boolean')
            ? createPrimeField(component.field.characteristic, wasmOptions)
            : createPrimeField(component.field.characteristic, wasmOptions);
    }
    else {
        throw new Error('non-prime fields are not supported');
    }
}

function buildConstants(component: AirComponent, field: FiniteField): (bigint | Vector | Matrix)[] {
    return component.constants.map(c => {
        if (c.isScalar) return c.value.value as bigint;
        else if (c.isVector) return field.newVectorFrom(c.value.value as bigint[]);
        else return field.newMatrixFrom(c.value.value as bigint[][]);
    });
}

function buildStaticRegisters(component: AirComponent) {
    const inputs: InputDescriptor[] = [];
    const masked: MaskRegisterDescriptor[] = [];
    const cyclic: RegisterEvaluatorSpecs[] = [];

    for (let register of component.staticRegisters) {
        if (register instanceof InputRegister) {
            inputs.push({
                rank    : register.rank,
                parent  : findInputParentIndex(register, component),
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
            cyclic.push({ cyclic: true, values: register.getValues() });
        }
    }

    return { inputs, masked, cyclic };
}

function findInputParentIndex(register: InputRegister, component: AirComponent): number | undefined {
    let index: number | undefined;
    while (register.master) {
        index = register.master.index;
        register = component.staticRegisters[register.master.index] as InputRegister;
    }
    return index;
}