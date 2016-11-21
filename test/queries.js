var db = require('../app/database.js');
var queries = require('../app/queries.js');
var assert = require('assert');

describe('database queries', function() {

    // This might take a while...
    this.timeout(30000);
    before(function(done) {
        db.connect(db.MODE_TEST, function(err) {
            assert.equal(null, err);
            db.mongo().dropCollection('courses', function(err, result) {
                queries.indexInstitutions(function(err, report) {
                    assert.equal(null, err);
                    assert.ok(report.institutionsIndexed > 0);
                    // Usually around ~800 courses for every institution, having
                    // less than that for all of our indexers combined is
                    // generally a good indication that something is wrong
                    assert.ok(report.coursesIndexed > 1000);
                    done();
                });
            });
        });
    });

    describe('#coursesInSubject', function(done) {
        it('should return courses in only one subject', function(done) {
            var subj = 'acc';
            queries.coursesInSubject(subj, function(err, docs) {
                for (var i = 0; i < docs.length; i++) {
                    assert.equal(docs[i].subject, subj.toUpperCase());
                }
                done();
            });
        });
    });
})
