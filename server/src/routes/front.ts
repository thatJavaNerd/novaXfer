import { Request, Response, Router } from 'express';
import * as path from 'path';
import Parameter = require('pinput');

export default function(): Router {
    const r = Router();

    r.get('/html/docs', (req: Request, res: Response) => {
        res.status(404).contentType('text/html').send('404 Not Found');
    });

    r.get('/html/docs/:id', (req: Request, res: Response) => {
        const id = new Parameter({
            name: 'id',
            rawInput: req.params.id,
            validate: (input: string) => /^[a-z]{1,30}$/.test(input)
        });

        if (!id.valid) {
            return sendBasic404(res);
        }

        sendView(res, 'docs/' + id.value);
    });

    r.get('*', (req: Request, res: Response) => {
        return sendView(res, 'index');
    });

    return r;
}

const sendView = (res: Response, base: string) => {
    res.sendFile(path.join(__dirname, '../views/' + base + '.html'), (err: Error) => {
        if (err !== undefined)
            sendBasic404(res);
    });
};

const sendBasic404 = (res: Response) => {
    res.status(404).contentType('text/html').send('404 Not Found');
};
