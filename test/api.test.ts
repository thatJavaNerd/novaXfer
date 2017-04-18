
import { expect, AssertionError } from 'chai'
import { Database, Mode } from '../src/Database';
import { createServer, doFullIndex } from '../src/server';
import { Application } from 'express';
import * as _ from 'lodash';
import { findIndexers } from '../src/indexers/index';
import * as request from 'supertest';
import {
    CourseEntry, CourseEquivalencyDocument,
    KeyCourse
} from '../src/models';
import EquivalencyDao from '../src/queries/EquivalencyDao';
import { ErrorData } from '../src/routes/api/v1/util';

describe('API v1', () => {
    let app: Application;
    const apiRequest = (relPath: string, expectedStatus: number, query?: object, validate?: (dataOrError: any) => void) => {
        return request(app)
            .get('/api/v1' + relPath + createQuery(query))
            .expect('Content-Type', /json/)
            .expect(expectedStatus)
            .then(res => {
                verifyResponse(res.body, expectedStatus);

                if (validate !== undefined)
                    validate(expectedStatus >= 200 && expectedStatus < 300 ? res.body.data : res.body.error);
            });
    };

    before('connect to and reset database', async function() {
        // Let it process
        this.timeout(30000);
        await Database.get().connect(Mode.TEST);
        await doFullIndex();
        app = createServer();
    });

    describe('GET /api/v1/*', () => {
        it('should 404 with JSON data', () => {
            return apiRequest('/foobar', 404, undefined, (error) => {
                expect(error.message).to.exist;
                expect(error.input).to.deep.equal({});
            });
        });
    });

    describe('GET /api/v1/institution', () => {
        it('should return all institutions', async () => {
            return apiRequest('/institution', 200, undefined, (data: any) => {
                expect(data).to.have.lengthOf(findIndexers().length);
            });
        });
    });

    describe('GET /api/v1/institution/:id', () => {
        it('should return only a single institution', async () => {
            const institution = findIndexers()[0].institution;
            return apiRequest(`/institution/${institution.acronym}`, 200, undefined, (data: any) => {
                expect(data.acronym).to.equal(institution.acronym);
                expect(data.fullName).to.equal(institution.fullName);
                expect(data.location).to.equal(institution.location);
            });
        });

        it('should error when given an invalid acronym', async () => {
            const badNames = [
                '123', // alphabetic only
                'foobar', // max of 3 letters
                'B_AZ', // alphabetic only
                'A' // at least 2 characters
            ];

            for (let name of badNames) {
                await apiRequest('/institution/' + name, 400, undefined, (error: any) => {
                    expect(error.input).to.deep.equal({ acronym: name });
                });
            }
        });

        it('should return an error when given a valid, but non-existent institution', async () => {
            return apiRequest('/institution/ABC', 404, undefined, (error: any) => {
                expect(error.input).to.deep.equal({ acronym: 'ABC' });
            });
        });

        it('should allow case-insensitive input', () => {
            const inst = findIndexers()[0].institution.acronym.toLowerCase();
            return apiRequest('/institution/' + inst, 200, undefined);
        });
    });

    describe('GET /api/v1/course', () => {
        it('should return object mapping a subject to the amount of courses in that subject', () => {
            return apiRequest('/course', 200, undefined, (data) => {
                expect(data).to.be.an('object');

                for (let subj of Object.keys(data)) {
                    // Make sure subject is uppercase
                    expect(subj.toUpperCase()).to.equal(subj);
                    // The value of each property represents the amount of
                    // courses in that subject, which logically should be a
                    // number greater than 0
                    expect(data[subj]).to.be.above(0);
                }
            });
        });
    });

    describe('GET /api/v1/course/:subject', () => {
        const verifyData = (data: any) => {
            expect(data).to.be.an('object');
            expect(Object.keys(data)).to.have.length.above(0);

            for (let courseNumber of Object.keys(data)) {
                expect(courseNumber).to.be.a('string');
                // There should logically be at least 1 institution if its in
                // the database
                expect(data[courseNumber]).to.be.above(0);
            }
        };

        it('should return an object mapping course numbers to the amount of institutions that have equivalencies', () => {
            return apiRequest('/course/MTH', 200, undefined, (data: any) => {
                verifyData(data);
            });
        });

        it('should return 404 when given a non-existent subject', () => {
            return apiRequest('/course/FOO', 404, undefined, (error: any) => {
                expect(error.input).to.deep.equal({ subject: 'FOO' });
            });
        });

        it('should\'t care about case', () => {
            return apiRequest('/course/mth', 200, undefined, (data) => {
                verifyData(data);
            });
        });
    });

    describe('GET /api/v1/course/:subject/:number', () => {
        let course: KeyCourse;

        before('find a course', async () => {
            const data = await Database.get().mongo()
                .collection(EquivalencyDao.COLLECTION)
                .findOne({});

            expect(data.subject).to.be.a('string');
            expect(data.number).to.be.a('string');

            course = Object.freeze({
                subject: data.subject,
                number: data.number
            });
        });

        it('should return a single course entry', () => {
            return apiRequest(`/course/${course.subject}/${course.number}`, 200, undefined, (data: any) => {
                expect(data.subject).to.equal(course.subject);
                expect(data.number).to.equal(course.number);
            });
        });

        it('should not care about case', async () => {
            const matrix = [
                [course.subject.toLowerCase(), course.number.toUpperCase()],
                [course.subject.toUpperCase(), course.number.toLowerCase()],
                [course.subject.toLowerCase(), course.number.toLowerCase()]
            ];

            for (let param of matrix) {
                await apiRequest(`/course/${param[0]}/${param[1]}`, 200, undefined, (data: any) => {
                    expect(data.subject).to.equal(param[0].toUpperCase());
                    expect(data.number).to.equal(param[1].toUpperCase())
                });
            }
        });
    });

    describe('GET /api/v1/course/:subject/:number/:institutions', () => {

        const makeRequest = (institutions: string,
                             code: number,
                             validate?: (data: CourseEquivalencyDocument[]) => void) =>
            apiRequest(
                // relative path
                `/course/${course.subject}/${course.number}/${institutions}`,
                // expected HTTP status code
                code,
                // query
                undefined,
                // validation function
                (dataOrError) => {
                    if (code >= 200 && code < 300) {
                        // Dealing with successful response data, verify the
                        // basics and let validate() validate the equivalencies
                        const data = dataOrError as CourseEntry;

                        expect(data.subject).to.equal(course.subject);
                        expect(data.number).to.equal(course.number);

                        if (validate === undefined)
                            throw new AssertionError('successful response but validate was undefined');

                        validate(data.equivalencies);
                    } else {
                        const error = dataOrError as ErrorData;
                        // Got an unsuccessful response, validate it

                        // Make sure we have an error message at least 5
                        // characters long (5 is arbitrarily chosen)
                        expect(error.message).to.be.a('string');
                        expect(error.message).to.have.length.above(5);

                        // Ensure input is properly represented
                        expect(error.input).to.deep.equal({
                            subject: course.subject,
                            number: course.number,
                            institutions: _.map(_.split(institutions, ','), i => i.trim())
                        });
                    }
                }
            );

        let course: CourseEntry;
        let institutions: string[];

        before('find course data', async () => {
            // Hand pick this course because it has a lot of equivalencies and
            // 3 from VCU, which we can make sure to test
            course = await new EquivalencyDao().course('CSC', '110');
            institutions = _.uniq(_.map(course.equivalencies, e => e.institution));
        });

        it('should only return equivalencies for the given institution', () => {
            const institution = institutions[0];

            return makeRequest(institution, 200, (equivs: CourseEquivalencyDocument[]) => {
                expect(equivs).to.have.length(1);
                expect(equivs[0].institution).to.equal(institution.toUpperCase());
            });
        });

        it('should support multiple institutions separated by commas', () => {
            const selectedInsts = _.slice(institutions, 0, institutions.length - 1);
            const joined = _.join(selectedInsts, ',');

            return makeRequest(joined, 200, (equivs: CourseEquivalencyDocument[]) => {
                expect(equivs).to.have.length.at.least(selectedInsts.length);
                for (let equiv of equivs) {
                    expect(selectedInsts).to.include(equiv.institution);
                }
            });
        });

        it('should not care about case', () => {
            const institution = institutions[0].toLowerCase();

            return makeRequest(institution, 200, (equivs: CourseEquivalencyDocument[]) => {
                // We only asked for 1 institution but that institution
                expect(equivs).to.have.length.at.least(1);
                for (let equiv of equivs) {
                    expect(equiv.institution).to.equal(institution.toUpperCase());
                }
            });
        });

        it('should not care about whitespace', () => {
            const whitespaced = institutions[0] + ' , ' + institutions[1];

            return makeRequest(whitespaced, 200, (equivs: CourseEquivalencyDocument[]) => {
                expect(equivs).to.have.length.at.least(2);
                for (let equiv of equivs) {
                    expect(equiv.institution).to.be.oneOf([institutions[0], institutions[1]]);
                }
            });
        });

        it('should 404 when given a non-existent course', () => {
            return apiRequest('/course/foo/bar/uva', 404, undefined, (error: ErrorData) => {
                expect(error.input).to.deep.equal({
                    subject: 'FOO',
                    number: 'BAR',
                    institutions: ['UVA']
                });
            });
        });
    });

    after('disconnect from database', () => Database.get().disconnect());
});

let createQuery = (params: object | undefined) => {
    if (params === undefined) return '';

    let usableProps = _.filter(Object.keys(params), key => params[key] !== undefined);
    if (usableProps.length === 0) return '';

    let query = '?';
    for (let i = 0; i < usableProps.length; i++) {
        if (i !== 0) query += '&';
        query += usableProps[i] + '=' + params[usableProps[i]];
    }

    return query;
};

const verifyResponse = function(response: any, expectedStatus: number) {
    expect(response, 'response was null or undefined').to.exist;
    expect(response.status).to.equal(expectedStatus, 'unexpected status property value');

    if (expectedStatus >= 200 && expectedStatus < 300) {
        // Success
        expect(response.data, 'data did not exist on successful response').to.exist;
        expect(response.error, 'error existed on successful response').to.not.exist;
    } else {
        // Fail
        expect(response.data, 'data existed on unsuccessful response').to.not.exist;
        expect(response.error, 'erorr did not exist on unsuccessful response').to.exist;
    }
};