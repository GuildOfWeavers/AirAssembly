"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// MODULE VARIABLE PLACEHOLDERS
// ================================================================================================
const f = undefined;
const traceCycleLength = 0;
const traceRegisterCount = 0;
const compositionFactor = 0;
const extensionFactor = 0;
const constraints = [];
const staticRegisters = {};
const initializeTrace = undefined;
// GENERATED FUNCTION PLACEHOLDERS
// ================================================================================================
const applyTransition = function () { return []; };
const evaluateConstraints = function () { return []; };
// PROVER GENERATOR
// ================================================================================================
function createProver(inputs = []) {
    // validate inputs
    const { traceLength, registerSpecs, inputShapes } = digestInputs(inputs);
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
    const kRegisters = registerSpecs.map(r => buildStaticRegisterEvaluator(r));
    // EXECUTION TRACE GENERATOR
    // --------------------------------------------------------------------------------------------
    function generateExecutionTrace(seed) {
        const steps = traceLength - 1;
        let rValues = initializeTrace(f, seed);
        if (rValues.length !== traceRegisterCount) {
            throw new Error(`failed to initialize execution trace: seed didn't resolve to vector of ${traceRegisterCount} elements`);
        }
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
    function evaluateTransitionConstraints(polynomials) {
        const constraintCount = constraints.length;
        // make sure trace polynomials are valid
        validateTracePolynomials(polynomials, traceLength);
        // evaluate transition polynomials over composition domain
        const tEvaluations = f.evalPolysAtRoots(polynomials, compositionDomain);
        // initialize evaluation arrays
        const evaluations = new Array(constraintCount);
        for (let i = 0; i < constraintCount; i++) {
            evaluations[i] = new Array(compositionDomainSize);
        }
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
        return f.newMatrixFrom(evaluations);
    }
    // STATIC REGISTER EVALUATOR BUILDER
    // --------------------------------------------------------------------------------------------
    function buildStaticRegisterEvaluator(register) {
        // secret registers are evaluated over the entire evaluation domain
        const domain = register.secret ? evaluationDomain : compositionDomain;
        const factor = register.secret ? extensionFactor : compositionFactor;
        const poly = interpolateRegisterValues(register.values, domain);
        let evaluations;
        if (register.cyclic) {
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
            if (register.invert) {
                evaluations = f.addVectorElements(f.negVectorElements(evaluations), f.one);
            }
            if (register.rotate) {
                evaluations = f.rotateVector(evaluations, register.rotate * factor);
            }
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
        rootOfUnity: rootOfUnity,
        traceLength: traceLength,
        extensionFactor: extensionFactor,
        constraints: constraints,
        inputShapes: inputShapes,
        executionDomain: executionDomain,
        evaluationDomain: evaluationDomain,
        compositionDomain: compositionDomain,
        generateExecutionTrace: generateExecutionTrace,
        evaluateTransitionConstraints: evaluateTransitionConstraints,
        secretRegisterTraces: secretRegisterTraces
    };
}
exports.createProver = createProver;
// VERIFIER GENERATOR
// ================================================================================================
function createVerifier(inputShapes = [], publicInputs = []) {
    const { traceLength, registerSpecs } = digestPublicInputs(publicInputs, inputShapes);
    const evaluationDomainSize = traceLength * extensionFactor;
    const rootOfUnity = f.getRootOfUnity(evaluationDomainSize);
    // build static register evaluators
    const kRegisters = registerSpecs.map(r => buildStaticRegisterEvaluator(r));
    // CONSTRAINT EVALUATOR
    // --------------------------------------------------------------------------------------------
    function evaluateConstraintsAt(x, rValues, nValues, sValues) {
        // get values of static registers for the current position
        const kValues = new Array(kRegisters.length);
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
    function buildStaticRegisterEvaluator(register) {
        if (!register)
            return null;
        // determine number of steps per value
        const valueSpan = BigInt(traceLength / register.values.length);
        // build the polynomial describing the values
        const g = f.exp(rootOfUnity, BigInt(extensionFactor) * valueSpan);
        const poly = interpolateRegisterValues(register.values, g);
        if (register.cyclic) {
            // build and return cyclic evaluator function
            return (x) => f.evalPolyAt(poly, f.exp(x, valueSpan));
        }
        else {
            // build mask polynomial
            const mask = buildFillMask(register.values, traceLength);
            const mValueSpan = BigInt(traceLength / mask.length);
            const mg = f.exp(rootOfUnity, BigInt(extensionFactor) * mValueSpan);
            const maskPoly = interpolateRegisterValues(mask, mg);
            // build x coordinate rotator
            let xr = 0n;
            if (register.rotate) {
                const p = register.rotate > 0
                    ? BigInt(evaluationDomainSize - register.rotate * extensionFactor)
                    : BigInt(-register.rotate * extensionFactor);
                xr = f.exp(rootOfUnity, p);
            }
            // build and return the evaluator which combines value polynomial and mask polynomial
            const invert = register.invert;
            return (x) => {
                if (xr)
                    x = f.mul(x, xr);
                const v = f.evalPolyAt(poly, x);
                const m = f.evalPolyAt(maskPoly, f.exp(x, mValueSpan));
                return invert ? f.sub(f.one, f.mul(v, m)) : f.mul(v, m);
            };
        }
    }
    // VERIFICATION OBJECT
    // --------------------------------------------------------------------------------------------
    return {
        field: f,
        rootOfUnity: rootOfUnity,
        traceLength: traceLength,
        extensionFactor: extensionFactor,
        constraints: constraints,
        inputShapes: inputShapes,
        evaluateConstraintsAt: evaluateConstraintsAt
    };
}
exports.createVerifier = createVerifier;
// INPUT PROCESSING
// ================================================================================================
function digestInputs(inputs) {
    validateInputs(inputs);
    let specs = [];
    // build input register descriptors
    const shapes = new Array(staticRegisters.inputs.length);
    staticRegisters.inputs.forEach((register, i) => {
        shapes[i] = (register.parent === undefined) ? [1] : shapes[register.parent].slice(0);
        let values = unrollRegisterValues(inputs[i], i, register.rank, 0, shapes[i]);
        if (register.binary)
            validateBinaryValues(values, i);
        specs.push({
            cyclic: false,
            values: values,
            secret: register.secret,
            invert: false,
            rotate: register.offset
        });
    });
    // build and append masked register descriptors
    staticRegisters.masked.forEach(register => specs.push({
        cyclic: false,
        values: new Array(specs[register.source].values.length).fill(f.one),
        secret: false,
        invert: register.inverted,
        rotate: staticRegisters.inputs[register.source].offset
    }));
    // append cyclic register descriptors
    specs = specs.concat(staticRegisters.cyclic);
    const traceLength = computeTraceLength(shapes);
    return { traceLength, registerSpecs: specs, inputShapes: shapes };
}
exports.digestInputs = digestInputs;
function digestPublicInputs(inputs, shapes) {
    validatePublicInputs(inputs, shapes);
    let specs = [], inputIdx = 0;
    shapes.forEach((shape, regIdx) => {
        const register = staticRegisters.inputs[regIdx];
        if (register.secret) {
            specs.push(undefined);
        }
        else {
            let values = unrollRegisterValues(inputs[inputIdx], regIdx, register.rank, 0, shape);
            if (register.binary)
                validateBinaryValues(values, regIdx);
            specs.push({
                cyclic: false,
                values: values,
                secret: false,
                invert: false,
                rotate: register.offset
            });
            inputIdx++;
        }
    });
    // build and append masked register descriptors
    staticRegisters.masked.forEach(register => {
        const valueCount = shapes[register.source].reduce((p, c) => p * c, 1);
        specs.push({
            cyclic: false,
            values: new Array(valueCount).fill(f.one),
            secret: false,
            invert: register.inverted,
            rotate: staticRegisters.inputs[register.source].offset
        });
    });
    // append cyclic register descriptors
    specs = specs.concat(staticRegisters.cyclic);
    const traceLength = computeTraceLength(shapes);
    return { traceLength, registerSpecs: specs };
}
exports.digestPublicInputs = digestPublicInputs;
// VALIDATORS
// ================================================================================================
function validateInputs(inputs) {
    const expectedInputs = staticRegisters.inputs.length;
    if (expectedInputs === 0) {
        if (inputs.length > 0)
            throw new Error(`expected no inputs but received ${inputs.length} inputs`);
        return;
    }
    if (!Array.isArray(inputs))
        throw new Error(`invalid input object: '${inputs}'`);
    else if (inputs.length !== expectedInputs)
        throw new Error(`expected ${expectedInputs} inputs but received ${inputs.length} inputs`);
}
exports.validateInputs = validateInputs;
function validatePublicInputs(inputs, shapes) {
    const totalInputs = staticRegisters.inputs.length;
    const publicInputs = staticRegisters.inputs.reduce((p, c) => c.secret ? p : p + 1, 0);
    if (publicInputs === 0) {
        if (inputs.length > 0)
            throw new Error(`expected no public inputs but received ${inputs.length} inputs`);
        return;
    }
    if (totalInputs === 0) {
        if (shapes.length > 0)
            throw new Error(`expected no input shapes but received ${shapes.length} shapes`);
        return;
    }
    if (!Array.isArray(inputs))
        throw new Error(`invalid public input object: '${inputs}'`);
    else if (inputs.length !== publicInputs)
        throw new Error(`expected ${publicInputs} public inputs but received ${inputs.length} inputs`);
    if (!Array.isArray(shapes))
        throw new Error(`invalid input shape object: '${shapes}'`);
    else if (shapes.length !== totalInputs)
        throw new Error(`expected ${totalInputs} input shapes but received ${shapes.length} shapes`);
}
exports.validatePublicInputs = validatePublicInputs;
function validateTracePolynomials(trace, traceLength) {
    if (!trace)
        throw new TypeError('Trace polynomials is undefined');
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
exports.validateTracePolynomials = validateTracePolynomials;
function validateBinaryValues(values, regIdx) {
    for (let i = 0; i < values.length; i++) {
        let value = values[i];
        if (value !== f.one && value !== f.zero) {
            throw new Error(`invalid input for register ${regIdx}: value ${i} is non-binary`);
        }
    }
}
exports.validateBinaryValues = validateBinaryValues;
// HELPER FUNCTIONS
// ================================================================================================
function interpolateRegisterValues(values, domainOrRoot) {
    const ys = f.newVectorFrom(values);
    let xs;
    if (typeof domainOrRoot === 'bigint') {
        xs = f.getPowerSeries(domainOrRoot, ys.length);
    }
    else {
        const skip = domainOrRoot.length / values.length;
        xs = f.pluckVector(domainOrRoot, skip, ys.length);
    }
    return (ys.length < 4)
        ? f.interpolate(xs, ys)
        : f.interpolateRoots(xs, ys);
}
exports.interpolateRegisterValues = interpolateRegisterValues;
function buildSubdomain(domain, newLength) {
    const skip = domain.length / newLength;
    return f.pluckVector(domain, skip, newLength);
}
exports.buildSubdomain = buildSubdomain;
function buildFillMask(values, domainLength) {
    const period = domainLength / values.length;
    const mask = new Array(period).fill(f.zero);
    mask[0] = f.one;
    return mask;
}
exports.buildFillMask = buildFillMask;
function unrollRegisterValues(value, regIdx, rank, depth, shape) {
    if (typeof value === 'bigint') {
        if (depth !== rank)
            throw new Error(`values provided for register ${regIdx} do not match the expected signature`);
        if (!f.isElement(value))
            throw new Error(`input value ${value} for register ${regIdx} is not a valid field element`);
        return [value];
    }
    else {
        if (depth === rank)
            throw new Error(`values provided for register ${regIdx} do not match the expected signature`);
        if (!Array.isArray(value))
            throw new Error(`value provided for register ${regIdx} at depth ${depth} is invalid`);
        else if (value.length === 0)
            throw new Error(`number of values for register ${regIdx} at depth ${depth} must be greater than 0`);
        else if (!isPowerOf2(value.length))
            throw new Error(`number of values for register ${regIdx} at depth ${depth} must be a power of 2`);
        depth++;
        if (shape[depth] === undefined) {
            shape[depth] = value.length;
        }
        else if (value.length !== shape[depth]) {
            throw new Error(`values provided for register ${regIdx} do not match the expected signature`);
        }
        let result = [];
        for (let i = 0; i < value.length; i++) {
            result = [...result, ...unrollRegisterValues(value[i], regIdx, rank, depth, shape)];
        }
        return result;
    }
}
exports.unrollRegisterValues = unrollRegisterValues;
function computeTraceLength(shapes) {
    let result = 0;
    staticRegisters.inputs.forEach((register, i) => {
        if (register.steps) {
            const traceLength = shapes[i].reduce((p, c) => p * c, register.steps);
            if (result === 0) {
                result = traceLength;
            }
            else if (result !== traceLength) {
                throw new Error(`registers 0 and ${i} require traces of different lengths`);
            }
        }
    });
    if (result < traceCycleLength) {
        result = traceCycleLength;
    }
    return result;
}
exports.computeTraceLength = computeTraceLength;
function isPowerOf2(value) {
    return (value !== 0) && (value & (value - 1)) === 0;
}
exports.isPowerOf2 = isPowerOf2;
//# sourceMappingURL=template.js.map