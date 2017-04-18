import { Request, Response, Router } from 'express';
import institution from './institution';
import course from './course';
import { ErrorResponse } from './responses';

export default function(): [string, Router] {
    const router = Router();

    const modules: (() => [string, Router])[] = [
        institution,
        course
    ];

    for (let m of modules) {
        const data = m();
        // data[0] is the mount point, data[1] is the Router
        router.use(data[0], data[1]);
    }

    // Catch all requests to the API not handled by an API module to ensure the
    // client still receives JSON data
    router.get('/*', (req: Request, res: Response) => {
        const resp: ErrorResponse = {
            status: 404,
            error: {
                message: 'Not found',
                input: {}
            }
        };

        res.status(resp.status).json(resp);
    });

    return ['/v1', router];
}