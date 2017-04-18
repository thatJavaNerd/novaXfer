import { Request, Response, Router } from 'express';
import Parameter = require('pinput')

import { SuccessResponse } from './responses';
import { runQuery } from './util';
import EquivalencyDao from '../../../queries/EquivalencyDao';
import {
    validateCourseNumber, validateInstitutionAcronym,
    validateSubject
} from './validation';
import RouteModule from '../../RouteModule';

export default function(): RouteModule {
    const dao = new EquivalencyDao();

    const r = Router();

    const subjectParam = (req: Request) =>
        new Parameter({
            name: 'subject',
            rawInput: req.params.subject,
            validate: validateSubject,
            preprocess: val => val.trim(),
            // Make sure we give the query the uppercase value
            postprocess: val => val.toUpperCase()
        });

    const numberParam = (req: Request) =>
        new Parameter({
            name: 'number',
            rawInput: req.params.number,
            validate: validateCourseNumber,
            preprocess: val => val.trim(),
            // Make sure we give the query the uppercase value
            postprocess: val => val.toUpperCase()
        });

    const validateInstitutions = (institutions: string[]) => {
        for (let i of institutions) {
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
            (subj : string) => dao.numbersForSubject(subj),
            res
        );
    });

    r.get('/:subject/:number', async (req: Request, res: Response) => {
        return runQuery(
            // parameters
            [subjectParam(req), numberParam(req)],
            // query function
            (subj: string, number: string) => dao.course(subj, number),
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