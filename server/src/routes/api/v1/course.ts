import { Request, Response, Router } from 'express';
import Parameter = require('pinput');

import EquivalencyDao from '../../../queries/EquivalencyDao';
import { numberParam, subjectParam } from '../../params';
import RouteModule from '../../RouteModule';
import { SuccessResponse } from './responses';
import { runQuery } from './util';
import {
    validateInstitutionAcronym,
} from './validation';

export default function(): RouteModule {
    const dao = new EquivalencyDao();

    const r = Router();

    const validateInstitutions = (institutions: string[]) => {
        for (const i of institutions) {
            if (!validateInstitutionAcronym(i)) return false;
        }

        return true;
    };

    const institutionsParam = (req: Request) =>
        new Parameter({
            name: 'institutions',
            rawInput: req.params.institutions,
            validate: validateInstitutions,
            preprocess: (inst) => inst.toUpperCase(),
            array: true
        });

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
            (subj: string) => dao.numbersForSubject(subj),
            res
        );
    });

    r.get('/:subject/:number', async (req: Request, res: Response) => {
        return runQuery(
            // parameters
            [subjectParam(req), numberParam(req)],
            // query function
            (subj: string, numb: string) => dao.course(subj, numb),
            // response
            res
        );
    });

    r.get('/:subject/:number/:institutions', async (req: Request, res: Response) => {
        return runQuery(
            // parameters
            [subjectParam(req), numberParam(req), institutionsParam(req)],
            // query function
            (subj: string, num: string, institutions: string[]) =>
                dao.forCourse(subj, num, institutions),
            // response
            res
        );
    });

    return {
        mountPoint: '/course',
        router: r
    };
}
