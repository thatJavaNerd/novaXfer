import { Database, Mode } from '../src/Database';
import * as queries from '../src/queries';
import { IndexReport } from '../src/indexers/index';
import { expect } from 'chai';
import { Course } from '../src/models';
import { EquivalenciesForCourseReport } from '../src/queries';

describe('database queries', function() {
    const db = Database.get();

    // This might take a while...
    this.timeout(30000);

    before(function mongoConnect() {
        // In a perfect world we'd also indexInstitutions() before every test
        // but 1) ain't nobody got time for that and 2) these are all read-only
        // functions
        return db.connect(Mode.TEST);
    });

    describe('#indexInstitutions', function() {
        let report: IndexReport | null = null;

        before(function() {
            return queries.dropIfExists('courses')
            .then(queries.indexInstitutions)
            .then(function(result) {
                report = result;
            });
        });

        it('should provide a healthy average of courses per institution', function() {
            expect(report!.institutionsIndexed).to.be.above(0);
            // Usually around ~800 courses for every institution, having
            // less than that for all of our indexers combined is
            // generally a good indication that something is wrong
            expect(report!.coursesIndexed / report!.institutionsIndexed).to.be.above(800);
        });
    });

    describe('#coursesInSubject', function() {
        let docs: Course[] | null = null;
        const subj = 'acc';

        before(function() {
            return queries.coursesInSubject(subj).then(function(data: Course[]) {
                docs = data;
            });
        });

        it('should have at least one document', function() {
            expect(docs).to.have.length.above(0);
        });

        it('should return courses in only one subject', function() {
            for (let i = 0; i < docs!.length; i++) {
                expect(docs![i].subject).to.be.equal(subj.toUpperCase());
            }
        });
    });

    describe('#equivalenciesForCourse', function() {
        const institutions = ['VT', 'CNU', 'GMU', 'UVA'];
        const query = function(subj = 'FOR', num = '202', inst = institutions) {
            return queries.equivalenciesForCourse(subj, num, inst).then(function(data: EquivalenciesForCourseReport) {
                expect(data.subject).to.equal(subj.toUpperCase());
                expect(data.number).to.equal(num);
                expect(data.equivalencies).to.have.length.above(0);
                return data;
            });
        };

        it('should return exactly one course', function() {
            return query();
        });

        it('should accept lowercase subjects', function() {
            return query('for');
        });

        // it('should only return equivalencies for the given institutions', function() {
        //     return query().then(function(data: EquivalenciesForCourseReport) {
        //         for (let equiv of data.equivalencies) {
        //             expect(institutions).to.include(data.institution);
        //         }
        //     })
        // });
    });

    describe('#equivalenciesForInstitution', function() {
        let data = null;
        let institution = 'GMU';
        let courses = [
            {subject: 'ACC', number: '211'},
            {subject: 'MTH', number: '163'},
            {subject: 'CSC', number: '202'}
        ];

        before(function() {
            return queries.equivalenciesForInstitution(institution, courses)
            .then(function(result) {
                data = result;
            });
        });

        // TODO more tests
    });


    after(function() {
        return db.disconnect();
    });
});
