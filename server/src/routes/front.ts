import { NextFunction, Request, Response, Router } from 'express';
import * as fs from 'fs-extra-promise';
import * as path from 'path';
import Parameter = require('pinput');
import { numberParam, subjectParam } from './params';

import { KeyCourse } from '../models';
import EquivalencyDao from '../queries/EquivalencyDao';

export default function(): Router {
    const dao = new EquivalencyDao();

    const r = Router();
    const base = path.join(__dirname, '../views');

    const abs = (rel: string) => path.join(base, rel);

    r.get('/', (req: Request, res: Response) => {
        res.render('index');
    });

    r.get('/course/:subject/:number', async (req: Request, res: Response, next: NextFunction) => {
        const params: Parameter[] = [
            subjectParam(req),
            numberParam(req)
        ];

        for (const p of params) {
            if (!p.valid) {
                return next(p.error);
            }
        }

        const c: KeyCourse = {
            subject: params[0].value,
            number: params[1].value
        };

        if (!(await dao.exists(c.subject, c.number))) {
            return next();
        }

        res.render('course', c);
    });

    r.get('/partial/:name', async (req: Request, res: Response) => {
        const p = new Parameter({
            name: 'name',
            rawInput: req.params.name,
            validate: (name: string) => /^[A-Za-z.]{1,30}$/.test(name),
        });

        if (!p.valid) {
            return res.status(404).send('404');
        }

        const path = abs('partials/' + p.value + '.pug');
        if (!(await fs.existsAsync(path))) {
            return res.status(404).send('404');
        }

        res.render('partials/' + p.value);
    });

    return r;
}
