"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const galois_1 = require("@guildofweavers/galois");
// MODULE VARIABLE PLACEHOLDERS
// ================================================================================================
const f = galois_1.createPrimeField(96769n, false);
const traceRegisterCount = 0;
let inputProcessor = undefined;
const compositionFactor = 4;
function setInputProcessor(ip) {
    inputProcessor = ip;
}
exports.setInputProcessor = setInputProcessor;
// GENERATED FUNCTION PLACEHOLDERS
// ================================================================================================
const applyTransition = function () { return []; };
const evaluateConstraints = function () { return []; };
// PROOF OBJECT GENERATOR
// ================================================================================================
function initProof(inputs, extensionFactor) {
    // validate inputs
    const { traceLength, registers } = inputProcessor.digest(inputs);
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
    const secretRegisterTraces = [];
    // build static register evaluators
    // TODO: add cyclic registers
    const kRegisters = registers.map(r => buildStaticRegisterEvaluator(r));
    const test1 = [];
    const test2 = [];
    const test3 = [];
    for (let i = 0; i < compositionDomainSize; i++) {
        test1.push(kRegisters[0](i));
        test2.push(kRegisters[1](i));
        test3.push(kRegisters[2](i));
    }
    console.log('done!');
    // EXECUTION TRACE GENERATOR
    // --------------------------------------------------------------------------------------------
    function generateExecutionTrace() {
        const steps = traceLength - 1;
        let rValues = new Array(traceRegisterCount).fill(f.zero);
        let nValues = new Array(traceRegisterCount).fill(f.zero);
        const kValues = new Array(kRegisters.length).fill(f.zero);
        // initialize execution trace and copy over the first row
        const traceTable = new Array(traceRegisterCount);
        for (let register = 0; register < traceTable.length; register++) {
            traceTable[register] = new Array(traceLength);
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
    function evaluateTracePolynomials(polynomials) {
        const constraintCount = 1; // TODO
        // make sure trace polynomials are valid
        // validateTracePolynomials(polynomials, traceLength);
        // evaluate transition polynomials over composition domain
        const tEvaluations = f.evalPolysAtRoots(polynomials, compositionDomain);
        // initialize evaluation arrays
        const evaluations = new Array(constraintCount);
        const nfSteps = compositionDomainSize - compositionFactor;
        const rValues = new Array(traceRegisterCount);
        const nValues = new Array(traceRegisterCount);
        const kValues = new Array(kRegisters.length);
        // evaluate constraints for each position of the extended trace
        let qValues;
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
        // TODO:
        return undefined;
    }
    // STATIC BUILDERS
    // --------------------------------------------------------------------------------------------
    function buildStaticRegisterEvaluator(register) {
        // secret registers are evaluated over the entire evaluation domain
        const domain = register.secret ? evaluationDomain : compositionDomain;
        const factor = register.secret ? extensionFactor : compositionFactor;
        const poly = interpolateRegisterValues(register.values, domain);
        let evaluations;
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
            secretRegisterTraces.push(evaluations);
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
        field: f,
        traceLength: traceLength,
        traceRegisterCount: traceRegisterCount,
        generateExecutionTrace: generateExecutionTrace,
        evaluateTracePolynomials: evaluateTracePolynomials,
        secretRegisterTraces: secretRegisterTraces
    };
}
exports.initProof = initProof;
// VERIFICATION OBJECT GENERATOR
// ================================================================================================
function initVerification(traceShape, pInputs) {
}
exports.initVerification = initVerification;
// HELPER FUNCTIONS
// ================================================================================================
function interpolateRegisterValues(values, domain) {
    const skip = domain.length / values.length;
    const ys = f.newVectorFrom(values);
    const xs = f.pluckVector(domain, skip, ys.length);
    return f.interpolateRoots(xs, ys);
}
exports.interpolateRegisterValues = interpolateRegisterValues;
function buildSubdomain(domain, newLength) {
    const skip = domain.length / newLength;
    return f.pluckVector(domain, skip, newLength);
}
exports.buildSubdomain = buildSubdomain;
function buildFillMask(values, domain) {
    const period = domain.length / values.length;
    const mask = new Array(period).fill(f.zero);
    mask[0] = f.one;
    return mask;
}
exports.buildFillMask = buildFillMask;
//# sourceMappingURL=template.js.map