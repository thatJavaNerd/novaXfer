import { expect } from 'chai';

import { PatternHelper, PatternService } from './pattern.service';

describe('PatternService', () => {
    let pattern: PatternService;

    beforeEach(() => {
        pattern = new PatternService();
    });

    describe('get()', () => {
        it('should throw an Error when given a non-existent helper name', () => {
            expect(() => pattern.get('I don\'t exist')).to.throw(Error);
            expect(() => pattern.get('course')).to.not.throw(Error);
        });
    });

    describe('#noramlizeWhitespace()', () => {
        const expected = '1, 2, 3';
        const inputs = [
            '1, 2, 3',
            '   1,     2,  3 ',
            '1,\t2,\n3',
            '1,\t\t\t 2, 3',
            '1,\r\n2, 3'
        ];
        it('should remove all extraneous whitespace', () => {
            for (const i of inputs) {
                expect(PatternService.normalizeWhitespace(i)).to.equal(expected);
            }
        });
    });

    // Dynamically create tests for all PatternHelpers. Each key in this object
    // is the name of a PatternHelper which can be retrieved from
    // PatternHelper.get(). The values are PatternHelperTests, which specifies
    // valid input (and the expected result when thrown into helper.parse())
    // as well as invalid input
    const tests: { [name: string]: PatternHelperTest } = {
        course: {
            valid: {
                'CSC 202':         { subject: 'CSC', number: '202' },
                '   CSC   202 ':   { subject: 'CSC', number: '202' },
                ' csc   202     ': { subject: 'CSC', number: '202' }
            },
            invalid: [
                'FOO BAR',
                'CSC:202',
                '_CSC 202'
            ]
        }
    };

    for (const patternHelperName of Object.keys(tests)) {
        const spec = tests[patternHelperName];

        describe('PatternHelper: ' + patternHelperName, () => {
            let helper: PatternHelper<any>;
            before(() => {
                helper = pattern.get(patternHelperName);
            });

            describe('matches()', () => {
                it('should return true for all valid input', () => {
                    for (const validInput of Object.keys(spec.valid)) {
                        expect(helper.matches(validInput)).to.equal(true,
                            `Input ${validInput} was unexpectedly invalid`);
                    }
                });

                it('should return false for all invalid input', () => {
                    for (const invalidInput of spec.invalid) {
                        expect(helper.matches(invalidInput)).to.equal(false,
                            `Input ${invalidInput} was unexpectedly valid`);
                    }
                });
            });

            describe('parse()', () => {
                it('should match only relevant data', () => {
                    for (const input of Object.keys(spec.valid)) {
                        const expectedResult = spec.valid[input];
                        expect(helper.parse(input)).to.deep.equal(expectedResult);
                    }
                });
            });
        });
    }
});

interface PatternHelperTest {
    valid: { [input: string]: any };
    invalid: string[];
}
