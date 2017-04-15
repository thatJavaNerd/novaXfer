import { findIndexers, Indexer } from '../src/indexers/index';
import {
    Course, CreditRange, EquivalencyContext,
    Institution
} from '../src/models';
import { expect } from 'chai';
import { validateCourseArray, validateInstitution } from './validation';
import CnuIndexer from '../src/indexers/cnu';

describe('indexers', function() {
    // Increase timeout to 30 seconds because findAll() can be a long-running
    // function
    this.timeout(30000);

    const indexers = findIndexers();
    for (let ind of indexers) {
        describe(ind.institution.acronym + ' indexer', () => {
            it('should return an array of valid Courses', () => {
                return testIndexerEquivalencies(ind);
            });

            it('should have an Institution with valid properties', () => {
                validateInstitution(ind.institution);
            });
        });
    }
});

const minEquivalencies = 100;

function testIndexerEquivalencies(indexer: Indexer<any>) {
    return indexer.findAll().then(function(equivalencyContext: EquivalencyContext) {
        validateInstitution(equivalencyContext.institution);
        let equivs = equivalencyContext.equivalencies;
        expect(equivs.length).to.be.at.least(minEquivalencies);

        for (let i = 0; i < equivs.length; i++) {
            const equiv = equivs[i];

            // Test each equivalency
            validateCourseArray(equiv.input);
            validateCourseArray(equiv.output);
        }
    });
}
