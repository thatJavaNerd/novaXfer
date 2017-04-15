import { findIndexers, Indexer } from '../src/indexers/index';
import {
    Course, CreditRange, EquivalencyContext,
    Institution
} from '../src/models';
import { expect } from 'chai';

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

function testIndexerEquivalencies(indexer: Indexer) {
    return indexer.findAll().then(function(equivalencyContext: EquivalencyContext) {
        validateInstitution(equivalencyContext.institution);
        let equivs = equivalencyContext.equivalencies;
        expect(equivs.length).to.be.at.least(minEquivalencies);

        for (let i = 0; i < equivs.length; i++) {
            const equiv = equivs[ i ];

            // Test each equivalency
            validateCourseArray(equiv.input);
            validateCourseArray(equiv.output);
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
// Entire string must be alphabetic
const institutionLocationRegex = /^[A-Z]+$/i;

function validateInstitution(inst: Institution) {
    expect(inst.acronym).to.match(acronymRegex);
    expect(inst.fullName).to.match(fullNameRegex);
    expect(inst.location).to.match(institutionLocationRegex)
}

const isCreditRange = function(x: any): x is CreditRange {
    return x.min !== undefined && x.max !== undefined;
};

function validateCourseArray(array: Course[]) {
    expect(array).to.have.length.above(0);

    for (let course of array) {
        // Validate subject and number
        expect(course.number).to.match(courseNumberRegex);
        expect(course.subject).to.match(courseSubjectRegex);

        // Validate credit property
        const cr = course.credits;
        expect(cr).to.be.exist;
        if (isCreditRange(cr)) {
            expect(cr.min).to.be.below(cr.max)
        }
    }
}
