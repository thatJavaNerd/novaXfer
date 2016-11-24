var assert = require('assert');
var regex = require('../app/util/regex.js');

describe('utilities', function() {
    describe('#normalizeWhitespace', function() {
        it('should remove newlines', function() {
            var text = "bla bla\nbla bla";
            assert.equal("bla bla bla bla", regex.normalizeWhitespace(text));
        });
        it('should remove nbsp characters', function() {
            var text = "bla" + String.fromCharCode(160);
            assert.equal("bla ", regex.normalizeWhitespace(text));
        });
    });
});
