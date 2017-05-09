import { PlanDao } from '../../../queries/PlanDao';
import RouteModule from '../../RouteModule';
import { runQuery } from './util';

import { Request, Response, Router } from 'express';
import Parameter = require('pinput');
import * as shortid from 'shortid';

export default function(): RouteModule {
    const dao = new PlanDao();
    const r = Router();

    r.get('/:id', (req: Request, res: Response) => {
        const id = new Parameter({
            name: 'id',
            rawInput: req.params.id,
            // Prefer not to validate the ID here, but rather just throw a 404
            // when no results turn up
            validate: () => true
        });

        return runQuery(
            [id],
            (idParam) => dao.get(idParam),
            res
        );
    });

    return {
        mountPoint: '/plan',
        router: r
    };
}
