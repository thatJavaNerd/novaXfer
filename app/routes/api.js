var express = require('express');
var router = express.Router();
var queries = require('../queries.js');

router.get('/subject/:subject', function(req, res, next) {
    var findObj = {};
    var subj = req.params.subject;
    if (!validateSubject(subj))
        return next(new ApiError('Invalid parameter', 'subject', subj));

    queries.coursesInSubject(req.app.get('db'), subj, function(err, docs) {
        if (err !== null)
            return next(err);
        res.json(docs);
    });
});

router.get('/course/:course/:institutions', function(req, res, next) {
    var course = req.params.course;
    var institutionsRaw = req.params.institutions;

    if (course === undefined)
        return next(new ApiError('Missing parameter', 'course', course));
    if (institutionsRaw === undefined)
        return next(new ApiError('Missing parameter', 'institution', course));

    var courseParts = course.split(' ');
    var subject = courseParts[0];
    var number = courseParts[1];

    var institutions = institutionsRaw.split(',');

    queries.equivalenciesForCourse(req.app.get('db'), subject, number, institutions, function(err, doc) {
        if (err !== null)
            return next(new ApiError('Invalid course', 'subject|number', subject + '|' + number));
        res.json(doc);
    });
});

// Error handling
router.use('/', function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err);
});

function validateSubject(subj) {
    return /^[A-Z]+$/i.test(subj);
}

function ApiError(reason, parameter, value) {
    this.reason = reason;
    this.parameter = parameter;
    this.value = value;
    this.status = 400;
}

module.exports = router;
