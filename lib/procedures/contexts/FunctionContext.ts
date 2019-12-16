// IMPORTS
// ================================================================================================
import { FunctionContext as IFunctionContext } from '@guildofweavers/air-assembly';
import { AirSchema } from "../../AirSchema";
import { ExecutionContext } from "./ExecutionContext";
import { Dimensions } from '../../expressions';

// CLASS DEFINITION
// ================================================================================================
export class FunctionContext extends ExecutionContext implements IFunctionContext {

    readonly result: Dimensions;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema: AirSchema, result: Dimensions) {
        super(schema.field, schema.constants, schema.functions);
        this.result = result;
    }
}