var express = require('express');
var router = express.Router();
var db = require('../database.js');
var queries = require('../queries.js');

router.get('/subject/:subject', function(req, res, next) {
    var findObj = {};
    var subj = req.params.subject;
    if (!validateSubject(subj))
        return next(new ApiError('Invalid parameter', 'subject', subj));

    queries.coursesInSubject(subj).then(function(docs) {
        res.json(docs);
    }).catch(function(err) {
        next(new GeneralApiError(err));
    });
});

router.get('/course/:course/:institutions', function(req, res, next) {
    var course = req.params.course;
    var institutionsRaw = req.params.institutions;

    if (course === undefined)
        return next(new ParameterError('Missing parameter', 'course', course));
    if (institutionsRaw === undefined)
        return next(new ParameterError('Missing parameter', 'institution', course));

    var courseParts = course.split(' ');
    var subject = courseParts[0];
    var number = courseParts[1];

    var institutions = institutionsRaw.split(',');

    queries.equivalenciesForCourse(subject, number, institutions).then(function(doc) {
        res.json(doc);
    }).catch(function(err) {
        next(new ParameterError('Invalid course', ['subject', 'number'], [subject, number]));
    });
});

router.get('/institutions', function(req, res, next) {
    queries.listInstitutions().then(function(institutions) {
        res.json(institutions);
    }).catch(function(err) {
        return next(new GeneralApiError('Something went wrong'));
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

function GeneralApiError(reason, status = 400) {
    this.reason = reason;
    this.status = status;
}

function ParameterError(reason, parameter, value, status = 400) {
    this.reason = reason;
    this.parameter = parameter;
    this.value = value;
    this.status = status;
}

module.exports = router;
