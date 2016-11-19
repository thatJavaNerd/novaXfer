
/**
 * Retrieves all courses in a given subject
 */
module.exports.coursesInSubject = function(db, subject, done) {
    var col = db.collection('courses');
    // INJECTION WARNING
    col.find({subject: new RegExp('^' + subject + '$', 'i')})
        .sort({number: 1})
        .toArray(done);
};

/**
 * Gets a document representing the given course data, including only the
 * equivalencies belonging to the given institutions.
 */
module.exports.equivalenciesForCourse = function(db, courseSubject, courseNumber, institutions, done) {
    var matchEquivalencies = [];
    for (var i = 0; i < institutions.length; i++) {
        matchEquivalencies.push({"equivalencies.institution": institutions[i]});
    }
    db.collection('courses').aggregate([
        // Match first document with the given subject and number
        { $match: { subject: courseSubject, number: courseNumber} },
        { $limit: 1 },
        // Create seperate documents for each equivalency (all have same ID)
        { $unwind: "$equivalencies" },
        // Filter out all but the given institutions
        { $match: { $or: matchEquivalencies } },
        // Recombine the documents with only the required equivalencies
        { $group: {
            "_id": "$_id",
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
