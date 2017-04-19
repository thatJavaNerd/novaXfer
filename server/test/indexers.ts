import { expect } from 'chai';
import {
    determineEquivType,
    findIndexers, Indexer,
    normalizeWhitespace
} from '../src/indexers/index';
import { EquivType } from '../src/models';
import { validateCourseArray, validateInstitution } from './validation';

describe('indexers', function() {
    // Increase timeout to 30 seconds because findAll() can be a long-running
    // function
    this.timeout(30000);

    const indexers = findIndexers();
    for (const ind of indexers) {
        describe(ind.institution.acronym + ' indexer', () => {
            it('should return an array of valid Courses', () => {
                return testIndexerEquivalencies(ind);
            });

            it('should have an Institution with valid properties', () => {
                validateInstitution(ind.institution);
            });
        });
    }

    describe('utilities', () => {
        describe('normalizeWhitespace()', () => {
            const test = (input: string, expectedOutput: string) => {
                expect(normalizeWhitespace(input)).to.equal(expectedOutput);
            };

            it('should remove newlines', () => {
                test('bla bla\nbla bla', 'bla bla bla bla');
            });
            it('should remove nbsp characters', () => {
                test("foo" + String.fromCharCode(160) + "bar", 'foo bar');
            });
            it('should replace two or more space characters with a single space', () => {
                test("1  2      3 \n\n\r\n 4", '1 2 3 4');
            });
        });

        describe('findEquivType()', () => {
            it('should determine direct courses appropriately', () => {
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

                expect(determineEquivType(courses)).to.equal(EquivType.DIRECT);
            });

            it('should fail when given an empty array', () => {
                try {
                    determineEquivType([]);
                    expect(1).to.equal(0);
                } catch (err) {
                    // pass
                }
            });

            it('should return \'generic\' appropriately', () => {
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
});

const minEquivalencies = 100;

function testIndexerEquivalencies(indexer: Indexer<any>) {
    return indexer.findAll().then((equivalencyContext) => {
        validateInstitution(equivalencyContext.institution);
        expect(equivalencyContext.parseSuccessRate)
            .to.be.at.least(equivalencyContext.institution.parseSuccessThreshold);
        const equivs = equivalencyContext.equivalencies;
        expect(equivs.length).to.be.at.least(minEquivalencies);

        for (const equiv of equivs) {
            // Test each equivalency
            validateCourseArray(equiv.input);
            validateCourseArray(equiv.output);
        }
    });
}
