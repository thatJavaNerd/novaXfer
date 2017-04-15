import {
    Course, CourseEquivalency, EquivalencyContext,
    Institution
} from './models';
import { Database as db } from './Database';
import {
    BulkWriteOpResultObject, InsertWriteOpResult,
    UpdateWriteOpResult
} from "mongodb";
import { findIndexers, index, IndexReport } from './indexers/index';

const COLL_COURSES = 'courses';
const COLL_INSTITUTIONS = 'institutions';
const COLL_META = '__meta__';

// Increment when we change our dataset (index a new institution)
const CURRENT_DATASET_VERSION = 1;
const META_DOC_ID = 'metadata';

/**
 * Retrieves all courses in a given subject
 */
export function coursesInSubject(subject: string): Promise<any> {
    let col = db.get().mongo().collection(COLL_COURSES);
    // INJECTION WARNING
    return col.find({subject: subjectRegex(subject)})
        .sort({number: 1})
        .toArray();
}

export interface EquivalenciesForCourseReport {
    // Institution acronym
    institution: string;
    subject: string;
    number: string;
    equivalencies: CourseEquivalency[];
}

/**
 * Gets a document representing the given course data, including only the
 * equivalencies belonging to the given institutions.
 */
export function equivalenciesForCourse(courseSubject: string, courseNumber: string, institutions: string[]): Promise<EquivalenciesForCourseReport> {
    const matchEquivalencies: any[] = [];
    for (let i = 0; i < institutions.length; i++) {
        matchEquivalencies.push({"equivalencies.institution": institutions[i]});
    }

    return db.get().mongo().collection(COLL_COURSES).aggregate([
        // Match first document with the given subject and number
        { $match: { subject: subjectRegex(courseSubject), number: courseNumber} },
        { $limit: 1 },
        // Create seperate documents for each equivalency (all have same ID)
        { $unwind: "$equivalencies" },
        // Filter out all but the given institutions
        { $match: { $or: matchEquivalencies } },
        // Recombine the documents with only the required equivalencies
        { $group: {
            _id: "$_id",
            // Is there a better way to include these fields?
            subject: { $first: "$subject" },
            number: { $first: "$number" },
            equivalencies: {$push: "$equivalencies"}
        } }
    ]).toArray().then(function(docs) {
        if (docs.length === 0) {
            return {
                subject: courseSubject,
                number: courseNumber,
                equivalencies: []
            };
        } else if (docs.length === 1) {
            return docs[0];
        } else {
            return Promise.reject(new Error(`Expecting 1 result, got ${docs.length}`));
        }
    });
}

/**
 * Find all listed courses that have equivalencies at the given institution.
 *
 * @param institution The institution's acronym (GMU, VCU, etc)
 * @param courses
 */
export function equivalenciesForInstitution(institution: string, courses: Course[]) {
    // Create an array of filters to pass to $or
    let courseMatch: any[] = [];
    for (let c of courses) {
        courseMatch.push({subject: subjectRegex(c.subject), number: c.number});
    }

    return db.get().mongo().collection(COLL_COURSES).aggregate([
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
    ]).toArray().then(function(docs) {
        if (docs.length === 0) {
            return {
                institution: institution,
                courses: []
            };
        }
        return docs[0];
    });
}

export function listInstitutions(): Promise<Institution[]> {
    return db.get().mongo().collection(COLL_INSTITUTIONS).find().sort({ acronym: 1 }).toArray();
}

export function indexInstitutions(): Promise<IndexReport> {
    // Super sketch way of making this Promise chain return the result from
    // indexers.index() but it works
    let indexReport: IndexReport | null = null;

    // First find all of our institutions
    const indexers = findIndexers();
    const institutions = indexers.map(indexer => indexer.institution);

    // Then add all of them to the database
    return upsertInstitutions(institutions)
    .then(function() {
        // Then index all of the course equivalencies
        return index();
    }).then(function(result) {
        indexReport = result;
        // Then add those equivalencies to the database
        return bulkUpsert(result.equivalencyContexts);
    }).then(function() {
        return upsertMetadata();
    }).then(function() {
        return indexReport;
    });
}

export function dropIfExists(collection: string): Promise<boolean> {
    return db.get().mongo().listCollections({name: collection}).toArray().then(function(colls) {
        if (colls.length > 0) {
            return db.get().mongo().dropCollection(colls[0].name);
        } else {
            return Promise.resolve(true);
        }
    });
}

export function shouldIndex(): Promise<boolean> {
    return db.get().mongo().collection(COLL_META).findOne({_id: META_DOC_ID}).then(function(meta) {
        if (meta === null) return true;
        if (meta.datasetVersion === undefined) return true;
        return meta.datasetVersion !== CURRENT_DATASET_VERSION;
    });
}

function upsertMetadata(): Promise<UpdateWriteOpResult> {
    return db.get().mongo().collection(COLL_META)
        .updateOne(
            {_id: META_DOC_ID},
            { $set: { datasetVersion: CURRENT_DATASET_VERSION } },
            { upsert: true }
        );
}

function bulkUpsert(equivalencyContexts: EquivalencyContext[]): Promise<BulkWriteOpResultObject> {
    let operations: any[] = [];
    for (let context of equivalencyContexts) {
        let institution = context.institution;
        for (let eq of context.equivalencies) {
            operations.push({
                updateOne: {
                    filter: {
                        number: eq.keyCourse.number,
                        subject: eq.keyCourse.subject
                    },
                    update: {
                        // Add to equivalencies array if it doesn't already exist
                        $addToSet: {
                            equivalencies: {
                                "institution": institution.acronym,
                                "type": eq.type,
                                "input": eq.input,
                                "output": eq.output
                            }
                        }
                    },
                    upsert: true
                }
            });

        }
    }
    return db.get().mongo().collection(COLL_COURSES).bulkWrite(operations);
}

function upsertInstitutions(institutions: Institution[]): Promise<InsertWriteOpResult> {
    return exports.dropIfExists(COLL_INSTITUTIONS).then(function() {
        return db.get().mongo().collection(COLL_INSTITUTIONS).insertMany(institutions);
    });
}

function subjectRegex(subj: string): RegExp {
    return new RegExp('^' + subj + '$', 'i');
}
