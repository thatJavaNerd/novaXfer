import Parameter = require('pinput');
import Contract = require('pinput/contract');
import { Response } from 'express';
import { ErrorResponse, ResponseBase, SuccessResponse } from './responses';
import * as _ from 'lodash';
import { QueryError, QueryErrorType } from '../../../queries/errors';

/**
 * Runs a query and sends the result as JSON to the response. Takes input
 * Parameters and if all are valid, passes values to queryFn
 *
 * @param  {Parameter[]}     parameters An array of Parameters
 * @param  {function}  queryFn    Query function to execute
 * @param  {object}    res        Express Response object
 * @param contracts
 */
export async function runQuery(parameters: Parameter[],
                               queryFn: (...args: any[]) => any,
                               res: Response,
                               contracts: Contract[] = []): Promise<void> {
    // If any parameter is invalid, reject
    for (let p of parameters) {
        if (p.valid === false) {
            const errData: ErrorData = {
                message: p.error.message,
                input: p.error.data
            };
            return handleError(res, errData, p.error.code);
        }
    }

    for (let contract of contracts) {
        contract.check(parameters);
        if (contract.valid === false) {
            const errData: ErrorData = {
                message: contract.error.message,
                input: contract.error.data
            };
            return handleError(res, errData, contract.error.code);
        }
    }

    try {
        // Call queryFn with the parameter values
        return handleSuccess(res, await queryFn.apply(null, _.map(parameters, p => p.value)))
    } catch (ex) {
        let errorData: ErrorData = {
            message: 'Could not process request',
            input: _.zipObject(
                _.map(parameters, p => p.name),
                _.map(parameters, p => p.value)
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

        return handleError(res, errorData, code);
    }
}

export interface ErrorData {
    message: string;
    input: object;
}

function handleSuccess(res: Response, data: any, status = 200) {
    const body: SuccessResponse = {
        status: status,
        data: data
    };

    send(res, body, status);
}

function handleError(res: Response, error: ErrorData, status = 400) {
    const body: ErrorResponse = {
        status: status,
        error: error
    };

    send(res, body, status);
}

function send(res: Response, body: ResponseBase, status) {
    res.status(status);
    res.json(body);
}