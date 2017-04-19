
import { expect } from 'chai';
import { Course, CreditRange, Institution } from '../src/models';
import {
    acronymRegex,
    courseNumberRegex,
    courseSubjectRegex
} from '../src/routes/api/v1/validation';
// Match [at least one letter with an optional space] one or more times
// thorughout the entire string
const fullNameRegex = /^([A-Z&]+ ?)+$/i;
// Entire string must be alphabetic
const institutionLocationRegex = /^[A-Z]+$/i;

export function validateInstitution(inst: Institution) {
    expect(inst.acronym).to.match(acronymRegex);
    expect(inst.fullName).to.match(fullNameRegex);
    expect(inst.location).to.match(institutionLocationRegex);
    expect(inst.parseSuccessThreshold).to.be.within(0, 1);
}

const isCreditRange = (x: any): x is CreditRange =>
    x.min !== undefined && x.max !== undefined;

export function validateCourseArray(array: Course[]) {
    expect(array).to.have.length.above(0);

    for (const course of array) {
        // Validate subject and number
        expect(course.number).to.match(courseNumberRegex, JSON.stringify(course));
        expect(course.subject).to.match(courseSubjectRegex, JSON.stringify(course));

        // Validate credit property
        const cr = course.credits;
        expect(cr).to.be.exist;
        if (isCreditRange(cr)) {
            expect(cr.min).to.be.below(cr.max);
        }
    }
}
