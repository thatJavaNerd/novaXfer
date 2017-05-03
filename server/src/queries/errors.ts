export class QueryError extends Error {
    constructor(public readonly type: QueryErrorType, m?: string) {
        super(m);

        // http://stackoverflow.com/a/41144648/1275092
        Object.setPrototypeOf(this, QueryError.prototype);
    }
}

export enum QueryErrorType {
    MISSING
}
