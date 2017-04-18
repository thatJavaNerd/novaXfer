
import { Request, Response, NextFunction, Router } from 'express';
import InstitutionDao from '../../../queries/InstitutionDao';
import { SuccessResponse } from './responses';
import Parameter = require('pinput')
import { runQuery } from './util';
import RouteModule from '../../RouteModule';

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
            validate: (acronym) => acronym.length >= 2 &&
                acronym.length <= 3 &&
                /^[A-Za-z]{2,3}$/.test(acronym),
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