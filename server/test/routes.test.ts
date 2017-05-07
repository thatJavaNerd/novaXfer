import { Application } from 'express';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
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
                await expectHtml(app, ngRoute);
            }
        });
    });

    describe('GET /api', () => {
        it('should redirect to the docs', () =>
            request(app)
                .get('/api')
                .expect(302)
                .expect('Location', /\/docs\/api/)
        );
    });

    describe('GET /html/docs', () => {
        it('should return 404', () =>
            expectHtml(app, '/html/docs', 404)
        );
    });

    describe('GET /html/docs/:id', () => {
        it('should respond with HTML for valid IDs', () => {
            const basenames = _.map(fs.readdirSync(path.join(__dirname, '../../docs')), (f) => path.basename(f, '.md'));
            return testMultiple(app, '/html/docs/', basenames);
        });

        it('should 404 for invalid IDs', async () => {
            const names = ['foo', 'bar'];
            return testMultiple(app, '/html/docs/', names, 404);
        });
    });
});

const testMultiple = async (app: any, base: string, rels: string[], statusCode = 200): Promise<void> => {
    for (const rel of rels) {
        await expectHtml(app, base + rel, statusCode);
    }
};

const expectHtml = (app: any, path: string, statusCode = 200) =>
    request(app)
        .get(path)
        .expect(statusCode)
        .expect('Content-Type', /html/);
