
import Dao from './Dao';
import {
    CourseEntry, CourseEquivalencyDocument,
    EquivalencyContext,
    EquivType, KeyCourse
} from '../models';
import { ObjectID } from 'bson';
import { QueryError, QueryErrorType } from './errors';

export interface InstitutionFocusedEquivalency {
    institution: string;
    courses: CourseEntry[];
}

export default class EquivalencyDao extends Dao<CourseEntry, EquivalencyContext> {
    public static readonly COLLECTION = 'courses';

    constructor() {
        super(EquivalencyDao.COLLECTION);
    }

    /**
     * Gets an object mapping course subjects to the amount of courses in that
     * subject. Sorted alphabetically by subject.
     * @returns {Promise<{}>}
     */
    async subjects(): Promise<any> {
        const aggrResult = await this.coll().aggregate([
            {
                // Group all courses by subject and count
                $group: {
                    _id: '$subject',
                    count: { $sum: 1 }
                }
            },
            {
                // Sort by _id, which in this case is the subject
                $sort: { _id: 1 }
            }
        ]).toArray();

        // Map _id to count
        const result = {};
        for (let doc of aggrResult) {
            result[doc._id] = doc.count;
        }

        return result;
    }

    /**
     * Gets an object mapping course numbers to the amount of institutions that
     * have equivalencies for that course
     * @param subject
     * @returns {Promise<any>}
     */
    async numbersForSubject(subject: string): Promise<any> {
        const courses = await this.coll().aggregate([
            { $match: { subject: subject } },
            { $project: { number: 1, count: { $size: '$equivalencies' } } }
        ]).toArray();

        if (courses.length === 0)
            throw new QueryError(QueryErrorType.MISSING);


        const result = {};
        for (let doc of courses)
            result[doc.number] = doc.count;

        return result;
    }

    /**
     * Fetches a specific CourseEntry based on its KeyCourse subject and number
     * @param subject
     * @param number
     * @returns {Promise<any>}
     */
    async course(subject: string, number: string): Promise<CourseEntry> {
        const course = await this.coll()
            .findOne({ subject: subject, number: number });

        if (course === null)
            throw new QueryError(QueryErrorType.MISSING);

        return course;
    }

    /**
     * Gets a document representing the given course data, including only the
     * equivalencies belonging to the given institutions.
     */
    async forCourse(courseSubject: string, courseNumber: string, institutions: string[]): Promise<CourseEntry> {
        const matchEquivalencies: any[] = [];
        for (let i = 0; i < institutions.length; i++) {
            matchEquivalencies.push({'equivalencies.institution': institutions[i]});
        }

        const docs = await this.coll().aggregate([
            // Match first document with the given subject and number
            { $match: { subject: courseSubject, number: courseNumber} },
            { $limit: 1 },
            // Create seperate documents for each equivalency (all have same ID)
            { $unwind: '$equivalencies' },
            // Filter out all but the given institutions
            { $match: { $or: matchEquivalencies } },
            // Recombine the documents with only the required equivalencies
            { $group: {
                _id: '$_id',
                // Is there a better way to include these fields?
                subject: { $first: '$subject' },
                number: { $first: '$number' },
                equivalencies: {$push: '$equivalencies'}
            } }
        ]).toArray();

        switch (docs.length) {
            case 0:
                throw new QueryError(QueryErrorType.MISSING);
            case 1:
                return {
                    subject: docs[0].subject,
                    number: docs[0].number,
                    equivalencies: docs[0].equivalencies
                };
            default:
                throw new Error(`Expecting 1 result, got ${docs.length}`);
        }
    }

    /**
     * Find all listed courses that have equivalencies at the given institution.
     *
     * @param institution The institution's acronym (GMU, VCU, etc)
     * @param courses
     */
    async forInstitution(institution: string, courses: KeyCourse[]):
        Promise<InstitutionFocusedEquivalency> {

        // Create an array of filters to pass to $or
        let courseMatch: any[] = [];
        for (let c of courses) {
            courseMatch.push({subject: c.subject, number: c.number});
        }


        const docs = await this.coll().aggregate([
            {$match: { $or: courseMatch }},
            // Break down equivalencies array
            {$unwind: '$equivalencies'},
            // Filter array so we only match GMU equivalencies
            {$match: {'equivalencies.institution': institution}},
            // Reassemble the equivalency
            {$group: {
                _id: '$_id',
                // Store institution as a temporary value that way it gets
                // evaluated as a string rather than an array during the next
                // $group
                temp_institution: {$first: '$equivalencies.institution'},
                number: {$first: '$number'},
                subject: {$first: '$subject'},
                equivalencies: {$push: '$equivalencies'}
            }},
            {$group: {
                // Group all resulting documents together
                _id: null,
                institution: {$first: '$temp_institution'},
                // Push each original document as a subdocument of 'courses'
                courses: {$push: '$$ROOT'}
            }},
            {$project: {
                _id: false,
                // Remove all institution references because it's a root value
                institution: true,
                'courses.number': true,
                'courses.subject': true,
                'courses._id': true,
                'courses.equivalencies.input': true,
                'courses.equivalencies.output': true,
                'courses.equivalencies.institution': true,
                'courses.equivalencies.type': true

                // MongoDB doesn't like excluding non-root _id fields, so we have to
                // whitelist properties instead of blacklist them
                // 'courses.temp_institution': 0
            }}
        ]).toArray();

        if (docs.length === 0) {
            return {
                institution: institution,
                courses: []
            };
        }

        return docs[0];
    }

    /** @inheritDoc */
    protected async _put(data: EquivalencyContext[]): Promise<ObjectID[]> {
        // Bulk upsert all course equivalencies
        let operations: any[] = [];

        for (let context of data) {
            let institution = context.institution;

            for (let eq of context.equivalencies) {
                const equivalency: CourseEquivalencyDocument = {
                    institution: institution.acronym,
                    type: EquivType[eq.type].toLowerCase(),
                    input: eq.input,
                    output: eq.output
                };

                operations.push({
                    updateOne: {
                        filter: {
                            number: eq.keyCourse.number,
                            subject: eq.keyCourse.subject
                        },
                        update: {
                            // Add to equivalencies array if it doesn't already exist
                            $addToSet: {
                                equivalencies: equivalency
                            }
                        },
                        // If there's no document, create it
                        upsert: true
                    }
                });
            }
        }

        return (await this.coll().bulkWrite(operations)).upsertedIds;
    }
}