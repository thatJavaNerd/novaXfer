import { NextFunction, Request, Response, Router } from 'express';
import Parameter = require('pinput');

import { KeyCourse } from '../../../common/api-models';
import { SuccessResponse } from '../../../common/responses';
import EquivalencyDao from '../../../queries/EquivalencyDao';
import InstitutionDao from '../../../queries/InstitutionDao';

import RouteModule from '../../RouteModule';

import { runQuery } from './util';
import {
    validateCourseNumber, validateInstitutionAcronym,
    validateSubject
} from './validation';

export default function(): RouteModule {
    const dao = new InstitutionDao();
    const equivDao = new EquivalencyDao();

    const acronymParam = (req: Request) =>
        new Parameter({
            name: 'acronym',
            rawInput: req.params.acronym,
            validate: validateInstitutionAcronym,
            // Make sure we give the query the uppercase value
            postprocess: (value) => value.toUpperCase()
        });

    const r = Router();

    r.get('/', async (req: Request, res: Response, next: NextFunction) => {
        const resp: SuccessResponse = {
            status: 200,
            data: await dao.getAll()
        };

        res.json(resp);
    });

    r.get('/:acronym', (req: Request, res: Response) => {
        return runQuery(
            [acronymParam(req)],
            (acronym: string) => dao.getByAcronym(acronym),
            res
        );
    });

    r.get('/:acronym/:courses', (req: Request, res: Response) => {
        // CSC:202, CST:110
        const coursesParam = new Parameter({
            name: 'courses',
            rawInput: req.params.courses,
            array: true,
            preprocess: (val: string) => val.toUpperCase().split(':'),
            validate: (courseParts: string[][]) => {
                for (const course of courseParts) {
                    if (!(validateSubject(course[0]) && validateCourseNumber(course[1])))
                        return false;
                }
                return true;
            },
            postprocess: (courseParts: string[]): KeyCourse => {
                return {
                    subject: courseParts[0],
                    number: courseParts[1]
                };
            }
        });

        return runQuery(
            [acronymParam(req), coursesParam],
            (acronym: string, courses: KeyCourse[]) => equivDao.forInstitution(acronym, courses),
            res
        );
    });

    return {
        mountPoint: '/institution',
        router: r
    };
}
