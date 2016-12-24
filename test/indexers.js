var assert = require('assert');
var fs = require('fs');
var indexers = require('../app/indexers');
var util = require('../app/util.js');

describe('indexers', function() {
    describe('#findIndexers', function() {
        it('should return files that actually exist', function() {
            return indexers.findIndexers().then(function(result) {
                return Promise.all(result.map(ind => util.ensureFileExists(ind)));
            });
        });
    });

    // Increase timeout to 30 seconds because findAll() can be a long-running
    // function
    this.timeout(30000);

    describe('cnu#findAll', function() {
        it('should call each() with valid courses', function() {
            return testIndexer(require('../app/indexers/cnu.js'));
        });
    });

    describe('gmu#findAll', function() {
        it('should call each() with valid courses', function() {
            return testIndexer(require('../app/indexers/gmu.js'));
        });
    });

    describe('gt#findAll', function() {
        it('should call each() with valid courses', function() {
            return testIndexer(require('../app/indexers/gt.js'));
        });
    });

    describe('uva#findAll', function() {
        it('should call each() with valid courses', function() {
            return testIndexer(require('../app/indexers/uva.js'));
        });
    });

    describe('vcu#findAll', function() {
        it('should call each() with valid courses', function() {
            return testIndexer(require('../app/indexers/vcu.js'));
        });
    });

    describe('vt#findAll', function() {
        it('should call each() with valid courses', function() {
            return testIndexer(require('../app/indexers/vt.js'));
        });
    });

    describe('wm#findAll', function() {
        it('should call each() with valid courses', function() {
            return testIndexer(require('../app/indexers/wm.js'));
        });
    })
});
const minEquivalencies = 100;

function testIndexer(indexer) {
    assert.notEqual(undefined, indexer.findAll, 'findAll() was undefined');
    validateInstitution(indexer.institution);

    return indexer.findAll().then(function(equivs) {
        assert.ok(equivs.length >= minEquivalencies,
            `Indexer only provided ${equivs.length} equivalencies (expected min ${minEquivalencies})`);

        for (var i = 0; i < equivs.length; i++) {
            var equiv = equivs[i];

            // Test each equivalency
            var equivStr = JSON.stringify(equiv);
            assert.notEqual(null, equiv, "Equivalency was null: " + equivStr);

            validateInstitution(equiv.institution, equivStr);
            validateCourseArray(equiv.input, "input", equivStr);
            validateCourseArray(equiv.output, "output", equivStr);
        }
    });
}

// Match only uppercase letters and ampersands throughout the entire string
const acronymRegex = /^[A-Z&]+$/;
// Match [at least one letter with an optional space] one or more times
// thorughout the entire string
const fullNameRegex = /^([A-Z&]+ ?)+$/i;
// http://regexr.com/3euqa
const courseNumberRegex = /^[-\dA-Z#]{2,5}$/;
// Match 2 to 5 alphabeit characters
const courseSubjectRegex = /^[A-Z]{2,5}$/;

function validateInstitution(inst, json) {
    assert.notEqual(null, inst);
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
            `${courseSpecifier}.number didn't match: '${course.number}': ${json}`);
        assert.ok(courseSubjectRegex.test(course.subject),
            `${courseSpecifier}.subject didn't match: '${course.subject}': ${json}`);

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
