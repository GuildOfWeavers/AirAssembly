// INTERFACE IMPORTS
// ================================================================================================
import {
    FiniteField, Vector, Matrix, TransitionFunction, ConstraintEvaluator, StaticRegisterDescriptor
} from "@guildofweavers/air-assembly";
import { StaticRegisters } from "./registers";

// INTERFACES
// ================================================================================================
export type StaticRegisterEvaluator<T extends bigint | number> = (x: T) => bigint;

// MODULE VARIABLE PLACEHOLDERS
// ================================================================================================
const f: FiniteField = undefined as any;
const traceRegisterCount = 0;

const staticRegisters: StaticRegisters = undefined as any;
const compositionFactor = 4;

// GENERATED FUNCTION PLACEHOLDERS
// ================================================================================================
const applyTransition: TransitionFunction = function () { return []; }
const evaluateConstraints: ConstraintEvaluator = function () { return []; }

// PROOF OBJECT GENERATOR
// ================================================================================================
export function initProof(inputs: any[], extensionFactor: number): any {

    // validate inputs
    const { traceLength, registerSpecs } = staticRegisters.digestInputs(inputs);

    // build evaluation domain
    const evaluationDomainSize = traceLength * extensionFactor;
    const rootOfUnity = f.getRootOfUnity(evaluationDomainSize);
    const evaluationDomain = f.getPowerSeries(rootOfUnity, evaluationDomainSize);

    // build execution and composition domains by plucking values from evaluation domain
    const eSkip = extensionFactor;
    const executionDomain = f.pluckVector(evaluationDomain, eSkip, traceLength);

    const cSkip = extensionFactor / compositionFactor;
    const compositionDomainSize = traceLength * compositionFactor;
    const compositionDomain = f.pluckVector(evaluationDomain, cSkip, compositionDomainSize);

    // create a variable to hold secret register traces
    const secretRegisterTraces: Vector[] = [];

    // build static register evaluators
    const kRegisters = registerSpecs.map(r => buildStaticRegisterEvaluator(r));

    // EXECUTION TRACE GENERATOR
    // --------------------------------------------------------------------------------------------
    function generateExecutionTrace(): Matrix {
        const steps = traceLength - 1;
        
        let rValues = new Array<bigint>(traceRegisterCount).fill(f.zero);
        let nValues = new Array<bigint>(traceRegisterCount).fill(f.zero);
        const kValues = new Array<bigint>(kRegisters.length).fill(f.zero);

        // initialize execution trace and copy over the first row
        const traceTable = new Array<bigint[]>(traceRegisterCount);
        for (let register = 0; register < traceTable.length; register++) {
            traceTable[register] = new Array<bigint>(traceLength);
            traceTable[register][0] = rValues[register];
        }

        // apply transition function for each step
        let step = 0;
        while (step < steps) {
            let position = step * compositionFactor;

            // get values of static registers for the current step
            for (let i = 0; i < kValues.length; i++) {
                kValues[i] = kRegisters[i](position);
            }

            // populate nValues with the next computation state
            nValues = applyTransition(rValues, kValues);

            // copy nValues to execution trace and update rValues for the next iteration
            step++;
            for (let register = 0; register < nValues.length; register++) {
                traceTable[register][step] = nValues[register];
                rValues = nValues;
            }
        }
        
        return f.newMatrixFrom(traceTable);
    }

    // CONSTRAINT EVALUATOR
    // --------------------------------------------------------------------------------------------
    function evaluateTracePolynomials(polynomials: Matrix): Matrix {

        const constraintCount = 1;  // TODO

        // make sure trace polynomials are valid
        // validateTracePolynomials(polynomials, traceLength);

        // evaluate transition polynomials over composition domain
        const tEvaluations = f.evalPolysAtRoots(polynomials, compositionDomain);

        // initialize evaluation arrays
        const evaluations = new Array<bigint[]>(constraintCount);

        const nfSteps = compositionDomainSize - compositionFactor;
        const rValues = new Array<bigint>(traceRegisterCount);
        const nValues = new Array<bigint>(traceRegisterCount);
        const kValues = new Array<bigint>(kRegisters.length);

        // evaluate constraints for each position of the extended trace
        let qValues: bigint[]
        for (let position = 0; position < compositionDomainSize; position++) {

            // set values for trace registers for current and next steps
            for (let register = 0; register < traceRegisterCount; register++) {
                rValues[register] = tEvaluations.getValue(register, position);

                let nextStepIndex = (position + compositionFactor) % compositionDomainSize;
                nValues[register] = tEvaluations.getValue(register, nextStepIndex);
            }

            // get values of readonly registers for the current position
            for (let i = 0; i < kValues.length; i++) {
                kValues[i] = kRegisters[i](position);
            }

            // populate qValues with results of constraint evaluations
            qValues = evaluateConstraints(rValues, nValues, kValues);

            // copy evaluations to the result, and also check that constraints evaluate to 0
            // at multiples of the extensions factor
            if (position % compositionFactor === 0 && position < nfSteps) {
                for (let constraint = 0; constraint < constraintCount; constraint++) {
                    let qValue = qValues[constraint];
                    if (qValue !== 0n) {
                        throw new Error(`Constraint ${constraint} didn't evaluate to 0 at step: ${position / compositionFactor}`);
                    }
                    evaluations[constraint][position] = qValue;
                }
            }
            else {
                for (let constraint = 0; constraint < constraintCount; constraint++) {
                    let qValue = qValues[constraint];
                    evaluations[constraint][position] = qValue;
                }
            }
        }

        return f.newMatrixFrom(evaluations);
    }

    // STATIC BUILDERS
    // --------------------------------------------------------------------------------------------
    function buildStaticRegisterEvaluator(register: StaticRegisterDescriptor): StaticRegisterEvaluator<number> {

        // secret registers are evaluated over the entire evaluation domain
        const domain = register.secret ? evaluationDomain : compositionDomain;
        const factor = register.secret ? extensionFactor : compositionFactor;

        const poly = interpolateRegisterValues(register.values, domain);
        let evaluations: Vector;

        if (register.type === 'cyclic') {
            const subdomain = buildSubdomain(domain, register.values.length * factor);
            evaluations = f.evalPolyAtRoots(poly, subdomain);
        }
        else {
            evaluations = f.evalPolyAtRoots(poly, domain);
            
            const mask = buildFillMask(register.values, executionDomain);
            const maskPoly = interpolateRegisterValues(mask, domain);
            const subdomain = buildSubdomain(domain, mask.length * factor);
            let mEvaluations = f.evalPolyAtRoots(maskPoly, subdomain);

            if (evaluations.length !== mEvaluations.length) {
                const i = Math.log2(evaluations.length / mEvaluations.length);
                mEvaluations = f.duplicateVector(mEvaluations, i);
            }

            evaluations = f.mulVectorElements(evaluations, mEvaluations);
        }

        if (register.secret) {
            secretRegisterTraces.push(evaluations)
        }

        // the evaluator should return values over composition domain
        const stride = domain.length / compositionDomainSize;
        return (stride === 1)
            ? (position) => evaluations.getValue(position % evaluations.length)
            : (position) => evaluations.getValue((position * stride) % evaluations.length);
    }

    // PROOF OBJECT
    // --------------------------------------------------------------------------------------------
    return {
        field                       : f,
        traceLength                 : traceLength,
        traceRegisterCount          : traceRegisterCount,
        generateExecutionTrace      : generateExecutionTrace,
        evaluateTracePolynomials    : evaluateTracePolynomials,
        secretRegisterTraces        : secretRegisterTraces
    };
}

// VERIFICATION OBJECT GENERATOR
// ================================================================================================
export function initVerification(traceShape: number[], pInputs: bigint[][]): any {
    
}

// HELPER FUNCTIONS
// ================================================================================================
export function interpolateRegisterValues(values: bigint[], domain: Vector): Vector {
    const skip = domain.length / values.length;
    const ys = f.newVectorFrom(values);
    const xs = f.pluckVector(domain, skip, ys.length);
    return f.interpolateRoots(xs, ys);
}

export function buildSubdomain(domain: Vector, newLength: number): Vector {
    const skip = domain.length / newLength;
    return f.pluckVector(domain, skip, newLength);
}

export function buildFillMask(values: bigint[], domain: Vector): bigint[] {
    const period = domain.length / values.length;
    const mask = new Array(period).fill(f.zero);
    mask[0] = f.one;
    return mask;
}