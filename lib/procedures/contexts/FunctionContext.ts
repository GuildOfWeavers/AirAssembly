// IMPORTS
// ================================================================================================
import { FunctionContext as IFunctionContext } from '@guildofweavers/air-assembly';
import { AirSchema } from "../../AirSchema";
import { ExecutionContext } from "./ExecutionContext";
import { Dimensions } from '../../expressions';
import { validateHandle } from '../../utils';

// CLASS DEFINITION
// ================================================================================================
export class FunctionContext extends ExecutionContext implements IFunctionContext {

    readonly result     : Dimensions;
    readonly handle?    : string;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(schema: AirSchema, result: Dimensions, handle?: string) {
        super(schema.field, schema.constants, schema.functions);
        this.result = result;
        if (handle !== undefined) {
            this.handle = validateHandle(handle);
        }
    }
}