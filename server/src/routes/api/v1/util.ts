import Parameter = require('pinput');
import Contract = require('pinput/contract');
import { Response } from 'express';
import * as _ from 'lodash';

import {
    ErrorResponse, ResponseBase,
    SuccessResponse
} from '../../../common/responses';
import { QueryError, QueryErrorType } from '../../../queries/errors';

export interface QueryRequest {
    /** Called with the values of each Parameter if all are valid */
    query: (... args: any[]) => any;
    /** Any Parameters to the query */
    parameters: Parameter[];
    /** Express Response object */
    res: Response;

    /** Sends the result of the query to the client */
    transferResult?: (data: any) => void;
    /**
     * Any bindings between one or more Parameters that must be satisfied for
     * the query to execute successfully
     */
    contracts?: Contract[];
}

/**
 * Executes a query. If at least one Parameter is invalid or at least one
 * Contract is broken, a non-successful status-code will be returned to the
 * consumer (configurable via the Parameter/Contract constructor). The query
 * function is called with the value of each Parameter in the order they appear
 * in the array. If there query function throws an Error, runQuery() tries its
 * best to handle it by returning the most accurate status code available,
 * falling back to 500 Internal Server Error. The
 * @param request
 */
export async function runQuery(request: QueryRequest): Promise<void> {
    // If any parameter is invalid, reject
    for (const p of request.parameters) {
        if (p.valid === false) {
            const errData: ErrorData = {
                message: p.error.message,
                input: p.error.data
            };
            return handleError(request.res, errData, p.error.code);
        }
    }

    if (request.contracts) {
        for (const contract of request.contracts) {
            contract.check(request.parameters);
            if (contract.valid === false) {
                const errData: ErrorData = {
                    message: contract.error.message,
                    input: contract.error.data
                };
                return handleError(request.res, errData, contract.error.code);
            }
        }
    }

    let result;
    try {
        // Call query() with the Parameter values
        result = await request.query.apply(null, _.map(request.parameters, (p) => p.value));
    } catch (ex) {
        const errorData: ErrorData = {
            message: 'Could not process request',
            input: _.zipObject(
                _.map(request.parameters, (p) => p.name),
                _.map(request.parameters, (p) => p.value)
            )
        };

        let code = 500;

        if (ex instanceof QueryError) {
            switch (ex.type) {
                case QueryErrorType.MISSING:
                    errorData.message = 'Could not find the requested data';
                    code = 404;
                    break;
            }
        }

        if (code === 500)
            console.error(ex);

        return handleError(request.res, errorData, code);
    }

    if (request.transferResult)
        return request.transferResult(result);
    return handleSuccess(request.res, result);
}

export interface ErrorData {
    message: string;
    input: object;
}

function handleSuccess(res: Response, data: any, status = 200) {
    const body: SuccessResponse = {
        status,
        data
    };

    send(res, body, status);
}

function handleError(res: Response, error: ErrorData, status = 400) {
    const body: ErrorResponse = {
        status,
        error
    };

    send(res, body, status);
}

function send(res: Response, body: ResponseBase, status) {
    res.status(status);
    res.json(body);
}
