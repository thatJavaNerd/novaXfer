var indexers = require('./indexers');
var db = require('./database.js');

const COLL_COURSES = 'courses';
const COLL_INSTITUTIONS = 'institutions';

/**
 * Retrieves all courses in a given subject
 */
module.exports.coursesInSubject = function(subject) {
    var col = db.mongo().collection(COLL_COURSES);
    // INJECTION WARNING
    return col.find({subject: subjectRegex(subject)})
        .sort({number: 1})
        .toArray();
};

/**
 * Gets a document representing the given course data, including only the
 * equivalencies belonging to the given institutions.
 */
module.exports.equivalenciesForCourse = function(courseSubject, courseNumber, institutions) {
    var matchEquivalencies = [];
    for (var i = 0; i < institutions.length; i++) {
        matchEquivalencies.push({"equivalencies.institution": institutions[i]});
    }

    return db.mongo().collection(COLL_COURSES).aggregate([
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
                id: -1,
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
};

/**
 * Find all listed courses that have equivalencies at the given institution.
 *
 * @param institution The institution's acronym (GMU, VCU, etc)
 * @param courses Array of objects containing two keys: `subject` and `number`
 */
module.exports.equivalenciesForInstitution = function(institution, courses) {
    // Create an array of filters to pass to $or
    let courseMatch = [];
    for (let c of courses) {
        courseMatch.push({subject: subjectRegex(c.subject), number: c.number});
    }

    return db.mongo().collection(COLL_COURSES).aggregate([
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
            'courses.equivalencies.output': true

            // MongoDB doesn't like excluding non-root _id fields, so we have to
            // whitelist properties instead of blacklist them
            // 'courses.temp_institution': 0,
            // 'courses.equivalencies.institution': 0
        }}
    ]).toArray().then(function(docs) {
        return docs[0];
    });
}

module.exports.listInstitutions = function() {
    return db.mongo().collection(COLL_INSTITUTIONS).find().sort({ acronym: 1 }).toArray();
};

module.exports.indexInstitutions = function() {
    // Super sketch way of making this Promise chain return the result from
    // indexers.index() but it works
    var indexReport = null;

    // First find all of our institutions
    return indexers.findIndexers().then(function(inds) {
        var institutions = inds.map(indexer => require(indexer).institution);
        // Then add all of them to the database
        return upsertInstitutions(institutions);
    }).then(function() {
        // Then index all of the course equivalencies
        return indexers.index();
    }).then(function(result) {
        indexReport = result;
        // Then add those equivalencies to the database
        return bulkUpsert(result.equivalencies);
    }).then(function(result) {
        return indexReport;
    });
};

module.exports.dropIfExists = function(collection) {
    return db.mongo().listCollections({name: collection}).toArray().then(function(colls) {
        if (colls.length > 0) {
            return db.mongo().dropCollection(colls[0].name);
        } else {
            return Promise.resolve(true);
        }
    });
};

function bulkUpsert(equivalenciesByInstitution) {
    let operations = [];
    for (let institution of equivalenciesByInstitution) {
        for (let eq of institution) {
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
                                "institution": eq.institution.acronym,
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
    return db.mongo().collection(COLL_COURSES).bulkWrite(operations);
}

function upsertInstitutions(institutions, done) {
    return exports.dropIfExists(COLL_INSTITUTIONS).then(function() {
        return db.mongo().collection(COLL_INSTITUTIONS).insertMany(institutions);
    });
}

function subjectRegex(subj) {
    return new RegExp('^' + subj + '$', 'i');
}
