
import { Request, Response, NextFunction, Router } from 'express';
import InstitutionDao from '../../../queries/InstitutionDao';
import { SuccessResponse } from './responses';
import Parameter = require('pinput')
import { runQuery } from './util';
import RouteModule from '../../RouteModule';
import {
    validateCourseNumber, validateInstitutionAcronym,
    validateSubject
} from './validation';
import EquivalencyDao from '../../../queries/EquivalencyDao';
import { KeyCourse } from '../../../models';

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
                for (let course of courseParts) {
                    if (!(validateSubject(course[0]) && validateCourseNumber(course[1])))
                        return false;
                }
                return true;
            },
            postprocess: (courseParts: string[]): KeyCourse => {
                return {
                    subject: courseParts[0],
                    number: courseParts[1]
                }
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