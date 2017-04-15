
import { expect } from 'chai'
import { Course, CreditRange, Institution } from '../src/models';

// Match only uppercase letters and ampersands throughout the entire string
const acronymRegex = /^[A-Z&]+$/;
// Match [at least one letter with an optional space] one or more times
// thorughout the entire string
const fullNameRegex = /^([A-Z&]+ ?)+$/i;
// http://regexr.com/3euqa
const courseNumberRegex = /^[-\dA-Z#]{2,5}$/;
// Match 2 to 5 alphabetic characters
const courseSubjectRegex = /^[A-Z]{2,5}$/;
// Entire string must be alphabetic
const institutionLocationRegex = /^[A-Z]+$/i;

export function validateInstitution(inst: Institution) {
    expect(inst.acronym).to.match(acronymRegex);
    expect(inst.fullName).to.match(fullNameRegex);
    expect(inst.location).to.match(institutionLocationRegex)
}

const isCreditRange = function(x: any): x is CreditRange {
    return x.min !== undefined && x.max !== undefined;
};

export function validateCourseArray(array: Course[]) {
    expect(array).to.have.length.above(0);

    for (let course of array) {
        // Validate subject and number
        expect(course.number).to.match(courseNumberRegex, JSON.stringify(course));
        expect(course.subject).to.match(courseSubjectRegex, JSON.stringify(course));

        // Validate credit property
        const cr = course.credits;
        expect(cr).to.be.exist;
        if (isCreditRange(cr)) {
            expect(cr.min).to.be.below(cr.max)
        }
    }
}
