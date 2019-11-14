"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// PUBLIC FUNCTIONS
// ================================================================================================
function getBinaryFunction(operation, e1, e2) {
    switch (operation) {
        case 'add': {
            if (e1.isScalar)
                return `add`;
            else if (e1.isVector)
                return 'addVectorElements';
            else
                return 'addMatrixElements';
        }
        case 'sub': {
            if (e1.isScalar)
                return `sub`;
            else if (e1.isVector)
                return 'subVectorElements';
            else
                return 'subMatrixElements';
        }
        case 'mul': {
            if (e1.isScalar)
                return `mul`;
            else if (e1.isVector)
                return 'mulVectorElements';
            else
                return 'mulMatrixElements';
        }
        case 'div': {
            if (e1.isScalar)
                return `div`;
            else if (e1.isVector)
                return 'divVectorElements';
            else
                return 'divMatrixElements';
        }
        case 'exp': {
            if (e1.isScalar)
                return `exp`;
            else if (e1.isVector)
                return 'expVectorElements';
            else
                return 'expMatrixElements';
        }
        case 'prod': {
            if (e1.isVector && e2.isVector)
                return `combineVectors`;
            else if (e1.isMatrix && e2.isVector)
                return 'mulMatrixByVector';
            else
                return 'mulMatrixes';
        }
    }
}
exports.getBinaryFunction = getBinaryFunction;
function getUnaryFunction(operation, e) {
    switch (operation) {
        case 'neg': {
            if (e.isScalar)
                return `neg`;
            else if (e.isVector)
                return 'negVectorElements';
            else
                return 'negMatrixElements';
        }
        case 'inv': {
            if (e.isScalar)
                return `inv`;
            else if (e.isVector)
                return 'invVectorElements';
            else
                return 'invMatrixElements';
        }
    }
}
exports.getUnaryFunction = getUnaryFunction;
//# sourceMappingURL=utils.js.map