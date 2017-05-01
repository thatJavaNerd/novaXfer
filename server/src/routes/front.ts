import { Request, Response, Router } from 'express';
import * as path from 'path';
import Parameter = require('pinput');

export default function(): Router {
    const r = Router();

    r.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, '../views/index.html'));
    });

    return r;
}
