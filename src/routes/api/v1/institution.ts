
import { Request, Response, NextFunction, Router } from 'express';
import InstitutionDao from '../../../queries/InstitutionDao';
import { SuccessResponse } from './responses';
import Parameter = require('pinput')
import { runQuery } from './util';
import RouteModule from '../../RouteModule';
import { validateInstitutionAcronym } from './validation';

export default function(): RouteModule {
    const dao = new InstitutionDao();

    const r = Router();

    r.get('/', async (req: Request, res: Response, next: NextFunction) => {
        const resp: SuccessResponse = {
            status: 200,
            data: await dao.getAll()
        };

        res.json(resp);
    });

    r.get('/:acronym', async (req: Request, res: Response) => {
        const acronym = new Parameter({
            name: 'acronym',
            rawInput: req.params.acronym,
            validate: validateInstitutionAcronym,
            // Make sure we give the query the uppercase value
            postprocess: (value) => value.toUpperCase()
        });

        return runQuery([acronym],
            (acronym: string) => dao.getByAcronym(acronym),
            res);
    });

    return {
        mountPoint: '/institution',
        router: r
    };
}