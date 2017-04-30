
import { AssertionError, expect } from 'chai';
import { Application } from 'express';
import * as _ from 'lodash';
import * as request from 'supertest';
import {
    CourseEntry, CourseEquivalencyDocument, KeyCourse
} from '../src/common/api-models';
import { Database, Mode } from '../src/Database';
import { findIndexers } from '../src/indexers/index';
import EquivalencyDao, { InstitutionFocusedEquivalency } from '../src/queries/EquivalencyDao';
import { ErrorData } from '../src/routes/api/v1/util';
import { createServer, doFullIndex } from '../src/server';

describe('API v1', () => {
    let app: Application;
    const apiRequest = (relPath: string,
                        expectedStatus: number,
                        validate?: (dataOrError: any) => void) => {
        return request(app)
            .get('/api/v1' + relPath)
            .expect('Content-Type', /json/)
            .expect(expectedStatus)
            .then((res) => {
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
            return apiRequest('/foobar', 404, (error) => {
                expect(error.message).to.exist;
                expect(error.input).to.deep.equal({});
            });
        });
    });

    describe('GET /api/v1/institution', () => {
        it('should return all institutions', async () => {
            return apiRequest('/institution', 200, (data: any) => {
                expect(data).to.have.lengthOf(findIndexers().length);
            });
        });
    });

    describe('GET /api/v1/institution/:acronym', () => {
        it('should return only a single institution', async () => {
            const institutions = _.map(findIndexers(), (i) => i.institution);

            // Query every institution directly to make sure we can
            for (const institution of institutions) {
                await apiRequest(`/institution/${institution.acronym}`, 200, (data: any) => {
                    expect(data.acronym).to.equal(institution.acronym);
                    expect(data.fullName).to.equal(institution.fullName);
                    expect(data.location).to.equal(institution.location);
                });
            }
        });

        it('should error when given an invalid acronym', async () => {
            const badNames = [
                '123', // alphabetic only
                'foobar', // max of 3 letters
                'B_AZ', // alphabetic only
                'A' // at least 2 characters
            ];

            for (const name of badNames) {
                await apiRequest('/institution/' + name, 400, (error: any) => {
                    expect(error.input).to.deep.equal({ acronym: name });
                });
            }
        });

        it('should return an error when given a valid, but non-existent institution', async () => {
            return apiRequest('/institution/ABC', 404, (error: any) => {
                expect(error.input).to.deep.equal({ acronym: 'ABC' });
            });
        });

        it('should allow case-insensitive input', () => {
            const inst = findIndexers()[0].institution.acronym.toLowerCase();
            return apiRequest('/institution/' + inst, 200, undefined);
        });
    });

    describe('GET /api/v1/institution/:acronym/:courses', () => {
        // Hand-pick GMU because it has a lot of equivalencies
        const institution = 'GMU';

        it('should return an InstitutionFocusedEquivalency', () => {
            return apiRequest(`/institution/${institution}/CSC:202`, 200,
                (data: InstitutionFocusedEquivalency) => {

                expect(data.institution).to.equal(institution);
                expect(data.courses).to.exist;
                expect(Array.isArray(data.courses)).to.be.true;

                // We only requested 1 course
                expect(data.courses).to.have.lengthOf(1);

                expect(data.courses[0].subject).to.equal('CSC');
                expect(data.courses[0].number).to.equal('202');
                for (const equiv of data.courses[0].equivalencies) {
                    expect(equiv.institution).to.equal(institution);
                }
            });
        });

        it('should 404 when given a non-existent institution', () => {
            return apiRequest('/institution/FOO/CSC:202', 404, (error: ErrorData) => {
                expect(error.input).to.deep.equal({
                    acronym: 'FOO',
                    courses: [{
                        number: '202',
                        subject: 'CSC'
                    }]
                });
            });
        });

        it('should return a skeleton when the courses don\'t exist', () => {
            return apiRequest(`/institution/${institution}/FOO:BAR`, 200,
                (data: InstitutionFocusedEquivalency) => {

                expect(data.institution).to.equal(institution);
                expect(Array.isArray(data.courses)).to.be.true;
                expect(data.courses).to.have.lengthOf(0);
            });
        });

        it('should not care about case', async () => {
            const route = `/institution/${institution}/CSC:202`;
            let responseData: InstitutionFocusedEquivalency;

            await apiRequest(route, 200, (data: InstitutionFocusedEquivalency) => {
                // If we don't get any courses returned it's probably because we
                // choose a bad institution/course to test against
                expect(data.courses).to.have.length.above(0);
                responseData = data;
            });

            return apiRequest(route.toLowerCase(), 200, (data) => {
                // Just make sure the response we got sending parameters in
                // lowercase is the same is the 'normal' response data
                expect(data).to.deep.equal(responseData);
            });
        });
    });

    describe('GET /api/v1/course', () => {
        it('should return object mapping a subject to the amount of courses in that subject', () => {
            return apiRequest('/course', 200, (data) => {
                expect(data).to.be.an('object');

                for (const subj of Object.keys(data)) {
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

            for (const courseNumber of Object.keys(data)) {
                expect(courseNumber).to.be.a('string');
                // There should logically be at least 1 institution if its in
                // the database
                expect(data[courseNumber]).to.be.above(0);
            }
        };

        it('should return an object mapping course numbers to the amount of ' +
            'institutions that have equivalencies', () => {

            return apiRequest('/course/MTH', 200, (data: any) => {
                verifyData(data);
            });
        });

        it('should return 404 when given a non-existent subject', () => {
            return apiRequest('/course/FOO', 404, (error: any) => {
                expect(error.input).to.deep.equal({ subject: 'FOO' });
            });
        });

        it('should\'t care about case', () => {
            return apiRequest('/course/mth', 200, (data) => {
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
            return apiRequest(`/course/${course.subject}/${course.number}`, 200, (data: any) => {
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

            for (const param of matrix) {
                await apiRequest(`/course/${param[0]}/${param[1]}`, 200, (data: any) => {
                    expect(data.subject).to.equal(param[0].toUpperCase());
                    expect(data.number).to.equal(param[1].toUpperCase());
                });
            }
        });

        it('should 404 when given a non-existent course', () => {
            return apiRequest('/course/FOO/BAR', 404, (error: ErrorData) => {
                expect(error.input).to.deep.equal({
                    subject: 'FOO',
                    number: 'BAR'
                });
            });
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
                            institutions: _.map(_.split(institutions, ','), (i) => i.trim())
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
            institutions = _.uniq(_.map(course.equivalencies, (e) => e.institution));
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
                for (const equiv of equivs) {
                    expect(selectedInsts).to.include(equiv.institution);
                }
            });
        });

        it('should not care about case', () => {
            const institution = institutions[0].toLowerCase();

            return makeRequest(institution, 200, (equivs: CourseEquivalencyDocument[]) => {
                // We only asked for 1 institution but that institution
                expect(equivs).to.have.length.at.least(1);
                for (const equiv of equivs) {
                    expect(equiv.institution).to.equal(institution.toUpperCase());
                }
            });
        });

        it('should not care about whitespace', () => {
            const whitespaced = institutions[0] + ' , ' + institutions[1];

            return makeRequest(whitespaced, 200, (equivs: CourseEquivalencyDocument[]) => {
                expect(equivs).to.have.length.at.least(2);
                for (const equiv of equivs) {
                    expect(equiv.institution).to.be.oneOf([institutions[0], institutions[1]]);
                }
            });
        });

        it('should 404 when given a non-existent course', () => {
            return apiRequest('/course/foo/bar/uva', 404, (error: ErrorData) => {
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

const verifyResponse = (response: any, expectedStatus: number) => {
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
