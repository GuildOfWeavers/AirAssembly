// INTERFACE IMPORTS
// ================================================================================================
import {
    FiniteField, Vector, Matrix, TransitionFunction, ConstraintEvaluator, StaticRegisterDescriptor,
    ProofObject, VerificationObject
} from "@guildofweavers/air-assembly";
import { StaticRegisters } from "./registers";

// INTERFACES
// ================================================================================================
export type StaticRegisterEvaluator<T extends bigint | number> = (x: T) => bigint;

// MODULE VARIABLE PLACEHOLDERS
// ================================================================================================
const f: FiniteField = undefined as any;
const traceRegisterCount = 0;
const constraintCount = 0;
const compositionFactor = 0;

const staticRegisters: StaticRegisters = undefined as any;

// GENERATED FUNCTION PLACEHOLDERS
// ================================================================================================
const applyTransition: TransitionFunction = function () { return []; }
const evaluateConstraints: ConstraintEvaluator = function () { return []; }

// PROOF OBJECT GENERATOR
// ================================================================================================
export function initProof(inputs: any[], extensionFactor: number): ProofObject {

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
    
    // extract shapes from input register specs
    const inputShapes = registerSpecs.filter(r => r.type === 'input').map(r => r.shape!);

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

        // make sure trace polynomials are valid
        validateTracePolynomials(polynomials, traceLength);

        // evaluate transition polynomials over composition domain
        const tEvaluations = f.evalPolysAtRoots(polynomials, compositionDomain);

        // initialize evaluation arrays
        const evaluations = new Array<bigint[]>(constraintCount);
        for (let i = 0; i < constraintCount; i++) {
            evaluations[i] = new Array<bigint>(compositionDomainSize);
        }

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

    // STATIC REGISTER EVALUATOR BUILDER
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
            
            const mask = buildFillMask(register.values, traceLength);
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
        rootOfUnity                 : rootOfUnity,
        traceLength                 : traceLength,
        extensionFactor             : extensionFactor,
        constraintCount             : constraintCount,
        traceRegisterCount          : traceRegisterCount,
        staticRegisterCount         : staticRegisters.size,
        inputShapes                 : inputShapes,
        executionDomain             : executionDomain,
        evaluationDomain            : evaluationDomain,
        compositionDomain           : compositionDomain,
        generateExecutionTrace      : generateExecutionTrace,
        evaluateTracePolynomials    : evaluateTracePolynomials,
        secretRegisterTraces        : secretRegisterTraces
    };
}

// VERIFICATION OBJECT GENERATOR
// ================================================================================================
export function initVerification(inputShapes: number[][], publicInputs: any[]): VerificationObject {
    
    const { traceLength, registerSpecs } = staticRegisters.digestPublicInputs(publicInputs, inputShapes);
    const extensionFactor = 8; // TODO
        
    const evaluationDomainSize = traceLength * extensionFactor;
    const rootOfUnity = f.getRootOfUnity(evaluationDomainSize);

    // build static register evaluators
    const kRegisters = registerSpecs.map(r => buildStaticRegisterEvaluator(r));

    // CONSTRAINT EVALUATOR
    // --------------------------------------------------------------------------------------------
    function evaluateConstraintsAt(x: bigint, rValues: bigint[], nValues: bigint[], sValues: bigint[]): bigint[] {
        // get values of static registers for the current position
        const kValues = new Array<bigint>(kRegisters.length);
        for (let i = 0, j = 0; i < kValues.length; i++) {
            let evaluator = kRegisters[i];
            if (evaluator === null) {
                kValues[i] = sValues[j];
                j++;
            }
            else {
                kValues[i] = evaluator(x);
            }
        }

        // populate qValues with constraint evaluations
        const qValues = evaluateConstraints(rValues, nValues, kValues);
        return qValues;
    }

    // STATIC REGISTER EVALUATOR BUILDER
    // --------------------------------------------------------------------------------------------
    function buildStaticRegisterEvaluator(register: StaticRegisterDescriptor | undefined): StaticRegisterEvaluator<bigint> | null {
        if (!register) return null;

        // determine number of cycles over the execution trace
        const cycleCount = BigInt(traceLength / register.values.length);

        // build the polynomial describing cyclic values
        const g = f.exp(rootOfUnity, BigInt(extensionFactor) * cycleCount);
        const poly = interpolateRegisterValues(register.values, g);

        if (register.type === 'cyclic') {
            
            // build and return the evaluator function
            return (x) => f.evalPolyAt(poly, f.exp(x, cycleCount));
        }
        else {
            const mask = buildFillMask(register.values, traceLength);
            const mCycleCountCount = BigInt(traceLength / mask.length);
            const mg = f.exp(rootOfUnity, BigInt(extensionFactor) * mCycleCountCount);
            const maskPoly = interpolateRegisterValues(mask, mg);

            // build and return the evaluator function
            return (x) => {
                const v = f.evalPolyAt(poly, x);
                const m = f.evalPolyAt(maskPoly, f.exp(x, mCycleCountCount));
                return f.mul(v, m);
            };
        }
    }

    // VERIFICATION OBJECT
    // --------------------------------------------------------------------------------------------
    return {
        field                       : f,
        rootOfUnity                 : rootOfUnity,
        traceLength                 : traceLength,
        extensionFactor             : extensionFactor,
        constraintCount             : constraintCount,
        staticRegisterCount         : staticRegisters.size,
        traceRegisterCount          : traceRegisterCount,
        inputShapes                 : inputShapes,
        evaluateConstraintsAt       : evaluateConstraintsAt
    };
}

// HELPER FUNCTIONS
// ================================================================================================
export function interpolateRegisterValues(values: bigint[], domainOrRoot: Vector | bigint): Vector {
    const ys = f.newVectorFrom(values);
    if (typeof domainOrRoot === 'bigint') {
        const xs = f.getPowerSeries(domainOrRoot, ys.length);
        return f.interpolateRoots(xs, ys);
    }
    else {
        const skip = domainOrRoot.length / values.length;
        const xs = f.pluckVector(domainOrRoot, skip, ys.length);
        return f.interpolateRoots(xs, ys);
    }
}

export function buildSubdomain(domain: Vector, newLength: number): Vector {
    const skip = domain.length / newLength;
    return f.pluckVector(domain, skip, newLength);
}

export function buildFillMask(values: bigint[], domainLength: number): bigint[] {
    const period = domainLength / values.length;
    const mask = new Array(period).fill(f.zero);
    mask[0] = f.one;
    return mask;
}

export function validateTracePolynomials(trace: Matrix, traceLength: number): void {
    if (!trace) throw new TypeError('Trace polynomials is undefined');
    if (!trace.rowCount || !trace.colCount) { // TODO: improve type checking
        throw new TypeError('Trace polynomials must be provided as a matrix of coefficients');
    }
    if (trace.rowCount !== traceRegisterCount) {
        throw new Error(`Trace polynomials matrix must contain exactly ${traceRegisterCount} rows`);
    }

    if (trace.colCount !== traceLength) {
        throw new Error(`Trace polynomials matrix must contain exactly ${traceLength} columns`);
    }
}