import { Router } from 'express';
import v1 from './v1'

export default function(): Router {
    const router = Router();

    const modules: (() => [string, Router])[] = [
        v1
    ];

    for (let m of modules) {
        const data = m();
        // data[0] is the mount point, data[1] is the Router
        router.use(data[0], data[1]);
    }

    return router;
}
