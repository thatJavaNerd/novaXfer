import { Request, Response, Router } from 'express';
import * as path from 'path';

export default function(): Router {
    const r = Router();
    const base = path.join(__dirname, '../views');

    r.get('/', (req: Request, res: Response) => {
        res.sendFile(path.join(base, 'index.html'));
    });

    return r;
}
