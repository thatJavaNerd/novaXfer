var assert = require('assert');
var util = require('../app/util.js');
var normalizeWhitespace = util.normalizeWhitespace;

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
});
