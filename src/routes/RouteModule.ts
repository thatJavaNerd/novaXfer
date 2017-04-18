import { Router } from 'express';

interface RouteModule {
    router: Router,
    mountPoint: string
}

export default RouteModule;