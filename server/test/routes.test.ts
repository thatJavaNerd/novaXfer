import { Application } from 'express';
import * as fs from 'fs-extra-promise';
import * as _ from 'lodash';
import * as path from 'path';
import * as request from 'supertest';
import { createServer } from '../src/server';

describe('routes', () => {
    let app: Application;

    before('create app', () => {
        app = createServer();
    });

    describe('GET /', () => {
        it('should respond with HTML', () =>
            request(app)
                .get('/')
                .expect(200)
                .expect('Content-Type', /html/)
        );
    });

    describe('GET /api', () => {
        it('should redirect to the docs on GitHub', () =>
            request(app)
                .get('/api')
                .expect(302)
                .expect('Location', /github\.com/)
        );
    });

    describe('GET /partial/:name', () => {
        it('should 404 when given an invalid name', async () => {
            const names = [
                '_foo',
                'b@r',
                '123'
            ];

            for (const name of names) {
                await request(app)
                    .get('/partial/' + name)
                    .expect(404);
            }
        });

        const partials = _.map(fs.readdirSync('views/partials'), (p) => path.basename(p, '.pug'));
        for (const name of partials) {
            it(`should respond with HTML for "/partial/${name}"`, () =>
                request(app)
                    .get('/partial/' + name)
                    .expect(200)
                    .expect('Content-Type', /html/)
            );
        }
    });
});
