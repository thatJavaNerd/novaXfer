import { Request, Response, Router } from 'express';
import { Database } from '../../Database';
import RouteModule from '../RouteModule';
import v1 from './v1';

export default function(): Router {
    const router = Router();

    // Only load API modules if connected to the database. This is useful for
    // testing so we can test non-API routes without connecting to the database
    if (Database.get().isConnected()) {
        const modules: Array<() => RouteModule> = [
            v1
        ];

        for (const m of modules) {
            const mod = m();
            // data[0] is the mount point, data[1] is the Router
            router.use(mod.mountPoint, mod.router);
        }
    }

    router.get('/', (req: Request, res: Response) => {
        res.redirect('/docs/api');
    });

    return router;
}
