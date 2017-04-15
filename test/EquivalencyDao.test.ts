
import EquivalencyDao from '../src/queries/EquivalencyDao';
import { findIndexers } from '../src/indexers/index';
import * as _ from 'lodash';
import { expect } from 'chai';
import {
    CourseEquivalency, CourseEquivalencyDocument,
    EquivalencyContext, EquivType, KeyCourse
} from '../src/models';
import { validateCourseArray } from './validation';
import { Database, Mode } from '../src/Database';

describe('EquivalencyDao', () => {
    let dao: EquivalencyDao;

    before('connect to database', () => {
        return Database.get().connect(Mode.TEST).then(() => {
            dao = new EquivalencyDao();
        });
    });

    describe('queries and aggregations', () => {
        before('insert equivalencies', async function() {
            // Allow plenty of time for the Indexers to do their thing
            this.timeout(30000);

            // Find all EquivalencyContexts from all Indexers
            const equivs = await Promise.all(_.map(findIndexers(), i => i.findAll()));

            // Insert them into the database
            return dao.put(equivs);
        });

        describe('coursesInSubject()', () => {
            const queryAndTest = async (subj: string) => {
                const data = await dao.coursesInSubject(subj);
                expect(data).to.have.length.above(0);

                for (let equiv of data) {
                    expect(equiv.subject).to.equal(subj.toUpperCase());
                    expect(equiv.number).to.exist;
                    validateCourseEquivalencies(equiv.equivalencies);
                }
            };

            it('should only return courses in the given subject', () => {
                return queryAndTest('ENG');
            });

            it('should allow case-insensitive input', () => {
                return queryAndTest('eng');
            });
        });

        describe('forCourse()', () => {
            it('should return data for only the requested institutions', async () => {
                const course: KeyCourse = { subject: 'CSC', number: '202' };
                const institutions = ['UVA', 'GMU', 'CNU'];

                const data = await dao.forCourse(course.subject, course.number, institutions);
                expect(data.subject).to.equal(course.subject);
                expect(data.number).to.equal(course.number);
                expect(Array.isArray(data.equivalencies)).to.be.true;

                // If we have no equivalencies we're probably doing something
                // wrong. There should be at most 1 object in data.equivalencies
                // for every element in `institutions`
                expect(data.equivalencies).to.have.length.within(1, institutions.length);
            });

            it('should return a skeleton when given a non-existent institution', async () => {
                const data = await dao.forCourse('CSC', '202', ['bla bla bla']);
                expect(data.subject).to.equal('CSC');
                expect(data.number).to.equal('202');
                expect(Array.isArray(data.equivalencies)).to.be.true;
                expect(data.equivalencies).to.have.lengthOf(0);
            });
        });

        describe('forInstitution()', () => {
            it('should only pull data for the given institution and courses', async () => {
                const institution = 'GMU';
                const courses: KeyCourse[] = [
                    { subject: 'CSC', number: '202' },
                    { subject: 'ENG', number: '111' },
                    { subject: 'HIS', number: '101' }
                ];

                const data = await dao.forInstitution(institution, courses);
                expect(data.institution).to.equal(institution);

                for (let entry of data.courses) {
                    for (let equiv of entry.equivalencies) {
                        expect(equiv.institution).to.equal(institution);
                    }
                }
            });
        });


        after('drop collection', () => Database.get().dropIfExists(dao.collectionName))
    });

    describe('writing and inserting', () => {
        beforeEach('drop collection', () => Database.get().dropIfExists(dao.collectionName));

        describe('get() and put()', async () => {
            it('should pull out data that is symbolically the same as what was put in', async () => {
                const input = createInsertionFixture();
                const ids = await dao.put(input);

                // We insert one document for every object in EquivalencyContext.equivalencies
                expect(ids).to.have.lengthOf(input.equivalencies.length);

                // Verify that every document we inserted can be pulled out as
                // a valid CourseEquivalencyDocument
                for (let i = 0; i < ids.length; i++) {
                    // We're assuming that Mongo inserts these documents in the
                    // same order as they were specified in the EquivalencyContext
                    const id = ids[i];
                    const out = await dao.get(id);
                    expect(out).to.exist;

                    // Subject and number are pulled from the KeyCourse, the
                    // first input course in the array
                    expect(out.subject).to.equal(out.equivalencies[0].input[0].subject);
                    expect(out.number).to.equal(out.equivalencies[0].input[0].number);
                }
            });
        });
    });

    after('clean collection and disconnect', async () => {
        await Database.get().dropIfExists(dao.collectionName);
        return Database.get().disconnect();
    });
});

const validateCourseEquivalencies = function(eqs: CourseEquivalencyDocument[]) {
    for (let e of eqs) {
        expect(e.institution).to.be.a('string');
        expect(e.institution).to.have.length.above(0);
        expect(e.type).to.be.a('string');
        validateCourseArray(e.input);
        validateCourseArray(e.output);
    }
};

const createInsertionFixture = (): EquivalencyContext => ({
    institution: {
        acronym: 'XYZ',
        fullName: 'Some College',
        location: 'Earth'
    },
    equivalencies: [
        new CourseEquivalency(
            [{
                subject: 'ABC',
                number: '123',
                credits: 3
            }],
            [{
                subject: 'DEF',
                number: '123',
                credits: 3
            }],
            EquivType.DIRECT
        ),
        new CourseEquivalency(
            [{
                subject: 'ABC',
                number: '124',
                credits: 3
            }],
            [{
                subject: 'DEF',
                number: '1XX',
                credits: 3
            }],
            EquivType.GENERIC
        )
    ]
});
