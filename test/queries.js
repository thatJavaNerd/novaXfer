var db = require('../app/database.js');
var queries = require('../app/queries.js');
var assert = require('assert');

describe('database queries', function() {

    // This might take a while...
    this.timeout(30000);

    before(function() {
        return db.connect(db.MODE_TEST).then(function() {
            return queries.dropIfExists('courses');
        }).then(function() {
            return queries.indexInstitutions();
        }).then(function(report) {
            assert.ok(report.institutionsIndexed > 0);
            // Usually around ~800 courses for every institution, having
            // less than that for all of our indexers combined is
            // generally a good indication that something is wrong
            assert.ok(report.coursesIndexed > 800);
        });
    });

    describe('#coursesInSubject', function() {
        it('should return courses in only one subject', function() {
            var subj = 'acc';
            return queries.coursesInSubject(subj).then(function(docs) {
                for (var i = 0; i < docs.length; i++) {
                    assert.equal(docs[i].subject, subj.toUpperCase());
                }
            });
        })
    });

    describe('#equivalenciesForCourse', function() {
        it('should return exactly one course', function() {
            return queries.equivalenciesForCourse('CSC', '202', ['GMU']);
        });
    })
})
