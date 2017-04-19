export interface KeyCourse {
    subject: string;
    number: string;
}

export interface Course extends KeyCourse {
    credits?: number | CreditRange;
}

/**
 * Shape of the data when fetching from the courses collection through queries
 * and aggregations
 */
export interface CourseEntry {
    subject: string;
    number: string;
    equivalencies: CourseEquivalencyDocument[];
}

/**
 * Document representation of a CourseEquivalency when inserted into/pulled from
 * the database.
 */
export interface CourseEquivalencyDocument {
    institution: string;
    type: string;
    input: Course[];
    output: Course[];
}

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

export interface Institution {
    acronym: string;
    fullName: string;
    location: string;
    parseSuccessThreshold: number;
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
