import { Application } from 'express';
import * as request from 'supertest';

import { createServer } from '../src/server';

describe('routes', () => {
    let app: Application;

    before('create app and connect to database', async () => {
        app = createServer();
    });

    describe('GET /*', () => {
        // Let the Angular app show 404's
        it('should respond with HTML', async () => {
            const randomRoutes = ['/', '/home', '/foo'];
            for (const ngRoute of randomRoutes) {
                await request(app)
                    .get(ngRoute)
                    .expect(200)
                    .expect('Content-Type', /html/);
            }
        });
    });

    describe('GET /api', () => {
        it('should redirect to the docs on GitHub', () =>
            request(app)
                .get('/api')
                .expect(302)
                .expect('Location', /github\.com/)
        );
    });
});
