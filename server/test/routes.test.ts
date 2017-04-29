import { Application } from 'express';
import * as fs from 'fs-extra-promise';
import * as _ from 'lodash';
import * as path from 'path';
import * as request from 'supertest';

import { Database, Mode } from '../src/Database';
import {
    CourseEquivalency, EquivalencyContext,
    EquivType
} from '../src/models';
import EquivalencyDao from '../src/queries/EquivalencyDao';
import { createServer } from '../src/server';

describe('routes', () => {
    let app: Application;
    const mockContext: EquivalencyContext = {
        institution: {
            acronym: 'FOO',
            fullName: 'Foo School for Shits and Giggles',
            location: 'here',
            parseSuccessThreshold: 1.00
        },
        parseSuccessRate: 1.00,
        unparseable: 0,
        equivalencies: [
            new CourseEquivalency(
                [{
                    subject: 'AYY',
                    number: 'LMAO',
                    credits: 4
                }],
                [{
                    subject: 'AYY',
                    number: 'LMAO',
                    credits: 4
                }],
                EquivType.DIRECT
            )
        ]
    };

    const course = mockContext.equivalencies[0].input[0];

    before('create app and connect to database', async () => {
        await Database.get().connect(Mode.TEST);
        await Database.get().dropIfExists(EquivalencyDao.COLLECTION);
        // Insert one context
        await new EquivalencyDao().put(mockContext);

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

    describe('GET /course/:subject/:number', () => {
        it('should respond with HTML for valid courses', () =>
            request(app)
                .get(`/course/${course.subject}/${course.number}`)
                .expect(200)
                .expect('Content-Type', /html/));

        it('should respond with a 404 for non-existent courses', () =>
            request(app)
                .get('/course/FOO/BAR')
                .expect(404)
                .expect('Content-Type', /html/));
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

    after('disconnect from database', () => {
        return Database.get().disconnect();
    });
});
