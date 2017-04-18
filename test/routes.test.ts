import { Application } from 'express';
import { createServer } from '../src/server';
import * as request from 'supertest';

describe('routes', () => {
    let app: Application;

    before('create app', function() {
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
