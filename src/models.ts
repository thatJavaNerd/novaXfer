export interface KeyCourse {
    subject: string;
    number: string;
}

export interface Course extends KeyCourse {
    credits?: number | CreditRange;
}

export class CourseEquivalency {
    /** Course to perform lookups on */
    keyCourse: KeyCourse;

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

export interface EquivalencyContext {
    institution: Institution;
    equivalencies: CourseEquivalency[];
}

export interface Institution {
    acronym: string;
    fullName: string;
    location: string;
}

export interface CreditRange {
    min: number;
    max: number;
}

export enum EquivType {
    /** Transfers directly to a specific class */
    DIRECT,
    /** At least one course transfers as a generic course */
    GENERIC,
    /** The student should clarify with the institution about specifics */
    SPECIAL,
    /** Does not trasnfer at all */
    NONE
}

export const CREDITS_UNKNOWN = -1;
