// IMPORTS
// ================================================================================================
import { AirSchema } from '../AirSchema';
import { analyzeProcedure } from './analyzer';

// RE-EXPORTS
// ================================================================================================
export { analyzeProcedure } from './analyzer';

// PUBLIC FUNCTIONS
// ================================================================================================
export function getConstraintDegrees(schema: AirSchema): number[] {
    const result = analyzeProcedure(schema.constraintEvaluator);
    const degrees = result.degree as bigint[];
    return degrees.map(d => d > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Number(d));
}