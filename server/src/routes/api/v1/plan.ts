import { PlanDao } from '../../../queries/PlanDao';
import RouteModule from '../../RouteModule';
import { runQuery } from './util';

import { Request, Response, Router } from 'express';
import Parameter = require('pinput');

export default function(): RouteModule {
    const dao = new PlanDao();
    const r = Router();

    r.post('/', (req: Request, res: Response) => {
        return runQuery(
            [createTransferPlanParam(req)],
            // Workaround until pinput supports non-string inputs
            async (plan) => (await dao.put(req.body))[0],
            res
        );
    });

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

const createTransferPlanParam = (req: Request) => {
    const input = req.body;
    const errMsg = findTransferPlanError(req.body);
    // We have to work around pinput only allowing string values for rawInput
    return new Parameter({
        name: 'plan',
        rawInput: JSON.stringify(input),
        validate: () => errMsg === null,
        errorMessage: errMsg
    });
};

// TODO use ajv to parse JSON schemas
const findTransferPlanError = (plan: any, allowId = false): string | null => {
    if (plan === null || plan === undefined) return 'No data';
    if (!allowId && plan._id) return 'Use PUT /api/v1/plan to update a plan';

    if (plan.institutions === null || plan.institutions === undefined)
        return 'Property \'institutions\' must exist';
    if (!Array.isArray(plan.institutions))
        return 'institutions must be an array';
    for (let i = 0; i < plan.institutions.length; i++) {
        if (typeof plan.institutions[i] !== 'string')
            return `institutions[${i}] must be a string`;
        if (plan.institutions[i] !== plan.institutions[i].toUpperCase())
            return `institutions[${i}] must be uppercase`;
    }

    if (plan.semesters === null || plan.semesters === undefined)
        return 'Property \'semesters\' must exist';
    if (!Array.isArray(plan.semesters))
        return 'semesters must be an array';

    for (let i = 0; i < plan.semesters; i++) {
        if (typeof plan.semesters[i] !== 'object')
            return `semesters[${i}] must be an object`;

        if (plan.semesters[i].name === null || plan.semesters[i].name === undefined)
            return `semesters[${i}].name must exist`;
        if (typeof plan.semesters[i].name !== 'string')
            return `semesters[${i}].name must be a string`;

        if (plan.semesters[i].courses === null || plan.semesters[i].courses === undefined)
            return `semesters[${i}].courses must exist`;
        if (!Array.isArray(plan.semesters[i].courses))
            return `semesters[${i}].courses must be an array`;

        for (let j = 0; j < plan.semesters[i].courses; j++) {
            const course = plan.semesters[i].courses[j];
            const base = `semesters[${i}].courses[${j}] `;
            if (course === null || course === undefined)
                return base + 'must exist';
            if (typeof course !== 'object')
                return base + 'must be an object';
            if (typeof course.subject !== 'string' || typeof course.number !== 'string')
                return base + 'must be a KeyCourse';
        }
    }

    // No error found
    return null;
};
