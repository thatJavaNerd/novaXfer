const assert = require('assert');
const fs = require('fs');
const indexers = require('../app/indexers');

describe('indexers', function() {
    describe('#findIndexers', function() {
        it('should return files that actually exist', function(done) {
            indexers.findIndexers(function(err, indexers) {
                assert.equal(null, err);
                var count = 0;
                for (var i = 0; i < indexers.length; i++) {
                    fs.access(indexers[i], function(fserr) {
                        assert.equal(null, fserr)
                        if (++count == indexers.length) {
                            done();
                        }
                    })
                }
            })
        });
    });

    this.timeout(30000);
    describe('gt#findAll', function() {
        // Increase timeout to 30 seconds because findAll() can be a long-running
        // function
        it('should call each() with valid courses', function(done) {
            testIndexer(require('../app/indexers/gt.js'), done);
        });
    });

    describe('uva#findAll', function() {
        it('should call each() with valid courses', function(done) {
            testIndexer(require('../app/indexers/uva.js'), done);
        });
    });

    describe('vt#findAll', function() {
        it('should call each() with valid courses', function(done) {
            testIndexer(require('../app/indexers/vt.js'), done);
        });
    });

    describe('gmu#findAll', function() {
        it('should call each() with valid courses', function(done) {
            testIndexer(require('../app/indexers/gmu.js'), done);
        });
    });
});

// Match 2 to 5 alpha characters followed by a space, plus 2 to 4
// alphanumeric (including hyphen) characters
var courseRegex = /[A-Z]{2,5} [A-Z0-9-]{2,4}/
function testIndexer(indexer, mochaDone) {
    assert.notEqual(undefined, indexer.institution);
    assert.notEqual(undefined, indexer.findAll);

    indexer.findAll(function each(equiv) {
        // Test each equivalency
        var equivStr = JSON.stringify(equiv);
        assert.notEqual(null, equiv, "Equivalency was null: " + equiv);
        assert.notEqual(null, equiv.vccs, "VCCS course was null: " + equivStr);
        assert.ok(courseRegex.test(equiv.vccs.number), "VCCS course didn't match regex: " + equivStr);
        assert.ok(courseRegex.test(equiv.other.number), indexer.institution + " course didn't match regex: " + equivStr);
        assert.notEqual(null, equiv.other, equivStr);
        assert.notEqual(null, equiv.otherInstitution, equivStr);

        // Assert that the course's `credit` property is valid
        var creditErr = validateCreditRange(equiv.vccs);
        assert.equal(null, creditErr, creditErr + ": " + equivStr);
        creditErr = validateCreditRange(equiv.other);
        assert.equal(null, creditErr, creditErr + ": " + equivStr);
    }, function done(err) {
        assert.equal(null, err);
        // The indexer is done, let mocha know
        mochaDone();
    });
}

function validateCreditRange(course) {
    var type = typeof course.credits;
    if (type === 'object') {
        if (course.credits.min === undefined)
            return "course.credits.min was undefined";
        if (course.credits.max === undefined)
            return "course.credits.max was undefined";
        if (typeof course.credits.min !== 'number' || typeof course.credits.max !== 'number')
            return "Expecting course.credits.[min,max] to be Numbers";
        if (course.credits.min === course.credits.max)
            return "min === max, course.credits should be a Number";
        if (course.credits.max < course.credits.min)
            return "min > max";
    } else if (type !== 'number') {
        return "Expecting course.credits to be an Object or a Number, was " + type;
    }

    // All well and good
    return null;
}
