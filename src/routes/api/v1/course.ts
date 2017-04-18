
import { Request, Response, Router } from 'express';
import { SuccessResponse } from './responses';
import Parameter = require('pinput')
import { runQuery } from './util';
import EquivalencyDao from '../../../queries/EquivalencyDao';

export default function(): [string, Router] {
    const dao = new EquivalencyDao();

    const r = Router();

    const subjectParam = (req: Request) => {
        return new Parameter({
            name: 'subject',
            rawInput: req.params.subject,
            validate: (acronym) => acronym.length >= 2 &&
                acronym.length <= 3 &&
                /^[A-Za-z]{2,4}$/.test(acronym),
            preprocess: val => val.trim(),
            // Make sure we give the query the uppercase value
            postprocess: val => val.toUpperCase()
        });
    };

    r.get('/', async (req: Request, res: Response) => {
        const resp: SuccessResponse = {
            status: 200,
            data: await dao.subjects()
        };

        res.json(resp);
    });

    r.get('/:subject', async (req: Request, res: Response) => {
        return runQuery(
            [subjectParam(req)],
            (subj : string) => dao.numbersForSubject(subj),
            res
        );
    });

    r.get('/:subject/:number', async (req: Request, res: Response) => {
        const params = [
            subjectParam(req),
            new Parameter({
                name: 'number',
                rawInput: req.params.number,
                validate: (number: string) => /^[A-Za-z0-9]+$/.test(number),
                preprocess: val => val.trim(),
                // Make sure we give the query the uppercase value
                postprocess: val => val.toUpperCase()
            })
        ];

        return runQuery(
            params,
            (subj: string, number: string) => dao.course(subj, number),
            res
        );
    });

    return ['/course', r];
}