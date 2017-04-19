import { Application } from 'express';
import * as request from 'supertest';
import { createServer } from '../src/server';

describe('routes', () => {
    let app: Application;

    before('create app', () => {
        app = createServer();
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
