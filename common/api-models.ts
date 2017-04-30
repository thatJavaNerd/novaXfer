export interface KeyCourse {
    subject: string;
    number: string;
}

export interface Course extends KeyCourse {
    credits?: number | CreditRange;
}

export interface CreditRange {
    min: number;
    max: number;
}

export interface Institution {
    acronym: string;
    fullName: string;
    location: string;
    parseSuccessThreshold: number;
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
