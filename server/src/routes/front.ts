import { Request, Response, Router } from 'express';
import * as path from 'path';
import Parameter = require('pinput');

// All routes the Angular router uses so we only send index.html if one
// of these routes is hit. Otherwise, send a 404 page
export const NG_ROUTES = [
    '/'
];

export default function(): Router {
    const r = Router();

    for (const ngRoute of NG_ROUTES) {
        r.get(ngRoute, (req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, '../views/index.html'));
        });
    }

    return r;
}
