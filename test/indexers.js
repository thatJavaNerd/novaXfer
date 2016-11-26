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

    // Increase timeout to 30 seconds because findAll() can be a long-running
    // function
    this.timeout(30000);
    describe('gt#findAll', function() {
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

// Match 2 to 4 alphabetic characters (including hyphen and pound)
var courseNumberRegex = /[A-Z0-9-#]{2,4}/;
// Match 2 to 5 alphabeit characters
var courseSubjectRegex = /[A-Z]{2,5}/;

function testIndexer(indexer, mochaDone) {
    const minEquivalencies = 100;
    var equivCounter = 0;
    assert.notEqual(undefined, indexer.institution);
    assert.notEqual(undefined, indexer.findAll);

    indexer.findAll(function each(equiv) {
        // Test each equivalency
        var equivStr = JSON.stringify(equiv);
        assert.notEqual(null, equiv, "Equivalency was null: " + equivStr);

        validateInstitution(equiv.institution, equivStr);
        validateCourseArray(equiv.input, "input", equivStr);
        validateCourseArray(equiv.output, "output", equivStr);
        equivCounter++;
    }, function done(err) {
        assert.equal(null, err);
        assert.ok(equivCounter >= minEquivalencies,
            `Indexer only provided ${equivCounter} equivalencies (expected min ${minEquivalencies})`);
        // The indexer is done, let mocha know
        mochaDone();
    });
}

// Match only uppercase letters throughout the entire string
const acronymRegex = /^[A-Z]+$/;
// Match [at least one letter with an optional space] one ore more times
// thorughout the entire string
const fullNameRegex = /^([A-Z]+ ?)+$/i;

function validateInstitution(inst, json) {
    assert.notEqual(null, inst.acronym);
    assert.notEqual(null, inst.fullName);
    assert.ok(acronymRegex.test(inst.acronym));
    assert.ok(fullNameRegex.test(inst.fullName));
}

function validateCourseArray(array, arrayName, json) {
    assert.ok(Array.isArray(array), arrayName + " was expected to be an array: " + json);
    assert.ok(array.length > 0, arrayName + " length must be > 0: " + json);

    for (var i = 0; i < array.length; i++) {
        var course = array[i];
        var courseSpecifier = `${arrayName}[${i}]`;
        assert.notEqual(null, course, courseSpecifier + " was null: " + json);

        // Validate subject and number
        assert.ok(courseNumberRegex.test(course.number),
            courseSpecifier + " course number didn't conform: " + json)
        assert.ok(courseSubjectRegex.test(course.subject),
            courseSpecifier + " course subject didn't conform: " + json);

        // Validate credit property
        var creditErr = validateCreditRange(course, courseSpecifier);
        assert.equal(null, creditErr, creditErr + ": " + json);
    }
}

function validateCreditRange(course, courseSpecifier) {
    var type = typeof course.credits;
    if (type === 'object') {
        if (course.credits.min === undefined)
            return courseSpecifier + ".credits.min was undefined";
        if (course.credits.max === undefined)
            return courseSpecifier + ".credits.max was undefined";
        if (typeof course.credits.min !== 'number' || typeof course.credits.max !== 'number')
            return "Expecting " + courseSpecifier + ".credits.[min,max] to be Numbers";
        if (course.credits.min === course.credits.max)
            return "min === max, " + courseSpecifier + ".credits should be a Number";
        if (course.credits.max < course.credits.min)
            return "min > max";
    } else if (type !== 'number') {
        return "Expecting " + courseSpecifier + ".credits to be an Object or a Number, was " + type;
    }

    // All well and good
    return null;
}
