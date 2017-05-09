import { AssertionError, expect } from 'chai';

import { QueryError, QueryErrorType } from '../src/queries/errors';

export const expectQueryError = async (fn: () => Promise<any>, type: QueryErrorType = QueryErrorType.MISSING) => {
    try {
        await fn();
        expect(true, 'should have thrown QueryError').to.be.false;
    } catch (ex) {
        if (ex instanceof AssertionError) {
            // In case we accidentally catch the AssertionError thrown
            // by the expect() in the try block
            throw ex;
        }

        expect(ex).to.be.instanceof(QueryError);
        expect(ex.type).to.equal(type);
    }
};
