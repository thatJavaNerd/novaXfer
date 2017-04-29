import { Application } from 'express';
import * as request from 'supertest';

import { NG_ROUTES } from '../src/routes/front';
import { createServer } from '../src/server';

describe('routes', () => {
    let app: Application;

    before('create app and connect to database', async () => {
        app = createServer();
    });

    for (const ngRoute of NG_ROUTES) {
        describe('GET ' + ngRoute, () => {
            it('should respond with HTML', () =>
                request(app)
                    .get(ngRoute)
                    .expect(200)
                    .expect('Content-Type', /html/)
            );
        });
    }

    describe('GET /api', () => {
        it('should redirect to the docs on GitHub', () =>
            request(app)
                .get('/api')
                .expect(302)
                .expect('Location', /github\.com/)
        );
    });
});
