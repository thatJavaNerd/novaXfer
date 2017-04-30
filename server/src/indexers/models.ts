import {
    Course, EquivType, Institution, KeyCourse
} from '../common/api-models';

export class CourseEquivalency {
    /** Course to perform lookups on */
    public keyCourse: KeyCourse;

    constructor(public input: Course[], public output: Course[], public type: EquivType) {
        if (input === null || input === undefined || input.length === 0) {
            throw new Error('input did not exist or was an empty array');
        }
        this.keyCourse = {
            subject: input[0].subject,
            number: input[0].number
        };
    }
}

/**
 * Used for inserting course equivalencies from the same institution into the
 * database. Equivalencies pulled from the database have the shape of
 * CourseEquivalencyDocument.
 */
export interface EquivalencyContext {
    institution: Institution;
    equivalencies: CourseEquivalency[];
    unparseable: number;
    parseSuccessRate: number;
}

export const CREDITS_UNKNOWN = -1;
