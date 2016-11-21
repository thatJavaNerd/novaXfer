var indexers = require('./indexers');
var db = require('./database.js');

/**
 * Retrieves all courses in a given subject
 */
module.exports.coursesInSubject = function(subject, done) {
    var col = db.mongo().collection('courses');
    // INJECTION WARNING
    col.find({subject: new RegExp('^' + subject + '$', 'i')})
        .sort({number: 1})
        .toArray(done);
};

/**
 * Gets a document representing the given course data, including only the
 * equivalencies belonging to the given institutions.
 */
module.exports.equivalenciesForCourse = function(courseSubject, courseNumber, institutions, done) {
    var matchEquivalencies = [];
    for (var i = 0; i < institutions.length; i++) {
        matchEquivalencies.push({"equivalencies.institution": institutions[i]});
    }
    db.mongo().collection('courses').aggregate([
        // Match first document with the given subject and number
        { $match: { subject: courseSubject, number: courseNumber} },
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
            credits: { $first: "$credits" },
            equivalencies: {$push: "$equivalencies"}
        } }
    ]).toArray(function(err, docs) {
        if (err !== null)
            return done(err);

        // Aggregation returns maximum of one document
        if (docs.length === 0)
            return done(`No such course: subject=${courseSubject}, number=${courseNumber}`);
        else
            return done(null, docs[0]);
    });
};

module.exports.indexInstitutions = function(done) {
    var courses = db.mongo().collection('courses');
    indexers.index(function(equivalency, institution) {
        // Add property for our schema
        equivalency.other.institution = equivalency.otherInstitution;
        courses.updateOne({number: equivalency.nvcc.number, subject: equivalency.nvcc.subject},
            {
                $setOnInsert: {
                    credits: equivalency.nvcc.credits,
                },
                // Add to equivalencies array if data already exists
                $addToSet: {
                    equivalencies: equivalency.other
                }
            },
            {upsert: true},
            function(err, result) {
                if (err !== null)
                    done(err);
            }
        );
    }, done);
};
