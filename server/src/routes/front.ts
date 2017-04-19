import { Request, Response, Router } from 'express';
import * as fs from 'fs-extra-promise';
import * as path from 'path';
import Parameter = require('pinput');

export default function(): Router {
    const r = Router();
    const base = path.join(__dirname, '../views');

    const abs = (rel: string) => path.join(base, rel);

    r.get('/', (req: Request, res: Response) => {
        res.sendFile(abs('index.html'));
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

        const path = abs('partials/' + p.value + '.html');
        if (!(await fs.existsAsync(path))) {
            return res.status(404).send('404');
        }

        res.sendFile(path);
    });

    return r;
}
