"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const index_1 = require("../../index");
// EXAMPLE CODE
// ================================================================================================
const schema = index_1.compile('./examples/ec/pointmul.aa');
const air = index_1.instantiate(schema);
console.log(`degree: ${air.maxConstraintDegree}`);
const gStart = Date.now();
let start = Date.now();
const pContext = air.initProvingContext([
    [2n, 17n],
    [23n, 18n],
    [[1n, 0n, 1n, 0n], [0n, 1n, 0n, 0n]]
]);
console.log(`Initialized proof object in ${Date.now() - start} ms`);
start = Date.now();
const trace = pContext.generateExecutionTrace();
console.log(`Execution trace generated in ${Date.now() - start} ms`);
printExecutionTrace(trace);
start = Date.now();
const pPolys = air.field.interpolateRoots(pContext.executionDomain, trace);
console.log(`Trace polynomials computed in ${Date.now() - start} ms`);
start = Date.now();
const pEvaluations = air.field.evalPolysAtRoots(pPolys, pContext.evaluationDomain);
console.log(`Extended execution trace in ${Date.now() - start} ms`);
start = Date.now();
const cEvaluations = pContext.evaluateTransitionConstraints(pPolys);
console.log(`Constraints evaluated in ${Date.now() - start} ms`);
printExecutionTrace(cEvaluations);
// PRINTING
// ================================================================================================
function printExecutionTrace(trace) {
    const steps = trace.colCount;
    const colWidth = Math.ceil(trace.elementSize * 1.2);
    // print header row
    const columnHeaders = ['step'.padEnd(colWidth, ' ')];
    columnHeaders.push(' | ');
    for (let i = 0; i < trace.rowCount; i++) {
        columnHeaders.push(`r${i}`.padEnd(colWidth, ' '));
    }
    const headerRow = columnHeaders.join('  ');
    console.log(headerRow);
    console.log('-'.repeat(headerRow.length));
    // print rows
    for (let i = 0; i < steps; i++) {
        let dataRow = [`${i}`.padEnd(colWidth, ' ')];
        dataRow.push(' | ');
        for (let j = 0; j < trace.rowCount; j++) {
            dataRow.push(`${trace.getValue(j, i)}`.padEnd(colWidth, ' '));
        }
        console.log(dataRow.join('  '));
    }
    console.log('-'.repeat(headerRow.length));
}
exports.printExecutionTrace = printExecutionTrace;
//# sourceMappingURL=index.js.map