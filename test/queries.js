var db = require('../app/database.js');
var queries = require('../app/queries.js');
var assert = require('assert');

describe('database queries', function() {

    // This might take a while...
    this.timeout(30000);

    before(function mongoConnect() {
        // In a perfect world we'd also indexInstitutions() before every test
        // but 1) ain't nobody got time for that and 2) these are all read-only
        // functions
        return db.connect(db.MODE_TEST);
    })

    describe('#indexInstitutions', function() {
        let report = null;

        before(function() {
            return queries.dropIfExists('courses')
            .then(queries.indexInstitutions)
            .then(function(result) {
                report = result;
            });
        });

        it('should provide a healthy average of courses per institution', function() {
            assert.ok(report.institutionsIndexed > 0);
            // Usually around ~800 courses for every institution, having
            // less than that for all of our indexers combined is
            // generally a good indication that something is wrong
            assert.ok(report.coursesIndexed / report.institutionsIndexed > 800);
        });
    });

    describe('#coursesInSubject', function() {
        let docs = null;
        var subj = 'acc';

        before(function() {
            return queries.coursesInSubject(subj).then(function(data) {
                docs = data;
            });
        })

        it('should have at least one document', function() {
            assert.ok(docs.length > 0);
        });

        it('should return courses in only one subject', function() {
            for (var i = 0; i < docs.length; i++) {
                assert.equal(docs[i].subject, subj.toUpperCase());
            }
        });
    });

    describe('#equivalenciesForCourse', function() {
        let institutions = ['VT', 'CNU', 'GMU', 'UVA'];
        let query = function(subj = 'FOR', num = '202', inst = ['VT', 'CNU', 'GMU', 'UVA']) {
            return queries.equivalenciesForCourse(subj, num, inst);
        }

        it('should return exactly one course', function() {
            return query();
        });

        it('should accept lowercase subjects', function() {
            return query('for');
        });

        it('should only return equivalencies for the given institutions', function() {
            return query().then(function(data) {
                for (let equiv of data.equivalencies) {
                    assert.ok(institutions.indexOf(equiv.institution) !== -1,
                            `${equiv.institution} wasn't expected`);
                }
            })
        });
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

        it('should have only two root keys', function() {
            assert.ok(Object.keys(data).length === 2);
        });

        it('should have one element in the result for every course', function() {
            // could be more specific
            assert.ok(courses.length === data.courses.length);
        });

        it('should return blank data when no equivalencies are available', function() {
            let courses = [{subject: 'FOR', number: '202'}]
            return queries.equivalenciesForInstitution('GMU', courses).then(function(data) {
                assert.ok(Object.keys(data).length === 2);
                assert.ok(data.institution === 'GMU');
                assert.ok(data.courses.length === 0);
            });
        });
    })
})
