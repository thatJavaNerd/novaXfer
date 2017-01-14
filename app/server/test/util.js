var assert = require('assert');
var util = require('../src/util.js');
var models = require('../src/models.js');
var Course = models.Course;
var normalizeWhitespace = util.normalizeWhitespace;
var determineEquivType = util.determineEquivType;

describe('utilities', function() {
    describe('#normalizeWhitespace', function() {
        it('should remove newlines', function() {
            var text = "bla bla\nbla bla";
            assert.equal("bla bla bla bla", normalizeWhitespace(text));
        });
        it('should remove nbsp characters', function() {
            var text = "foo" + String.fromCharCode(160) + "bar";
            assert.equal("foo bar", normalizeWhitespace(text));
        });
        it('should replace two or more space characters with a single space', function() {
            var text = "1  2      3 \n\n\r\n 4";
            assert.equal("1 2 3 4", normalizeWhitespace(text));
        });
    });

    describe('#determineEquivType', function() {
        it('should determine direct courses appropriately', function() {
            var courses = [
                new Course('ABC', '101'),
                new Course('ABC', '102')
            ];

            assert.equal(determineEquivType(courses), models.TYPE_DIRECT);
        });
        it('should fail when given an empty array', function() {
            try {
                determineEquivType([]);
                assert.fail();
            } catch (err) {
                // pass
            }
        });
        it('should return \'generic\' appropriately', function() {
            var courses = [
                new Course('ABC', '1000T'),
                new Course('ABC', '1001')
            ];

            assert.equal(determineEquivType(courses, 'T'), models.TYPE_GENERIC);
        });
    });
});
