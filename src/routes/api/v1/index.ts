import { Request, Response, Router } from 'express';
import institution from './institution';
import course from './course';
import { ErrorResponse } from './responses';
import RouteModule from '../../RouteModule';

export default function(): RouteModule {
    const router = Router();

    const modules: (() => RouteModule)[] = [
        institution,
        course
    ];

    for (let m of modules) {
        const mod = m();
        // data[0] is the mount point, data[1] is the Router
        router.use(mod.mountPoint, mod.router);
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

    return {
        mountPoint: '/v1',
        router: router
    };
}