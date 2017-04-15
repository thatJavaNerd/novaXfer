import {determineEquivType, normalizeWhitespace} from "../src/util";
import {expect} from 'chai';
import {EquivType} from "../src/models";

describe('utilities', function() {
    describe('#normalizeWhitespace', function() {
        const test = (input: string, expectedOutput: string) => {
            expect(normalizeWhitespace(input)).to.equal(expectedOutput);
        };

        it('should remove newlines', function() {
            test('bla bla\nbla bla', 'bla bla bla bla');
        });
        it('should remove nbsp characters', function() {
            test("foo" + String.fromCharCode(160) + "bar", 'foo bar');
        });
        it('should replace two or more space characters with a single space', function() {
            test("1  2      3 \n\n\r\n 4", '1 2 3 4');
        });
    });

    describe('#determineEquivType', function() {
        it('should determine direct courses appropriately', function() {
            const courses = [
                {
                    subject: 'ABC',
                    number: '101'
                },
                {
                    subject: 'ABC',
                    number: '102'
                }
            ];

            expect(determineEquivType(courses)).to.equal(EquivType.DIRECT)
        });

        it('should fail when given an empty array', function() {
            try {
                determineEquivType([]);
                expect(1).to.equal(0);
            } catch (err) {
                // pass
            }
        });

        it('should return \'generic\' appropriately', function() {
            const courses = [
                {
                    subject: 'ABC',
                    number: '1000T'
                },
                {
                    subject: 'ABC',
                    number: '1001'
                }
            ];

            expect(determineEquivType(courses, 'T')).to.equal(EquivType.GENERIC);
        });
    });
});
