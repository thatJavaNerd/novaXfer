import { Request, Response, Router } from 'express';
import v1 from './v1'
import { Database } from '../../Database';

export default function(): Router {
    const router = Router();

    // Only load API modules if connected to the database. This is useful for
    // testing so we can test non-API routes without connecting to the database
    if (Database.get().isConnected()) {
        const modules: (() => [string, Router])[] = [
            v1
        ];

        for (let m of modules) {
            const data = m();
            // data[0] is the mount point, data[1] is the Router
            router.use(data[0], data[1]);
        }
    }

    router.get('/', (req: Request, res: Response) => {
        res.redirect('https://github.com/thatJavaNerd/novaXfer/blob/master/docs/api.md')
    });

    return router;
}
