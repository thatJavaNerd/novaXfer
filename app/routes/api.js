var express = require('express');
var router = express.Router();
var db = require('../database.js');
var queries = require('../queries.js');
let util = require('../util.js');

const subjectRegex = /^[A-Z]{3}$/i;
const numberRegex = /^\d{3}$/i;
const institutionRegex = /^[A-Z&]{2,3}$/;

/** Gets all courses in a given subject */
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

/**
 * Gets all courses with equivalencies specified by the given instituition
 * acronym. Ex: /course/CSC 202/GMU,GT would return a CSC 202 class with
 * equivalencies at only George Mason and Georgia Tech, if available.
 */
router.get('/course/:course/:institutions', function(req, res, next) {
    let course = util.normalizeWhitespace(req.params.course);
    let institutionsRaw = util.normalizeWhitespace(req.params.institutions);

    if (course === undefined)
        return next(new ParameterError('Missing parameter', {'course': course} ));
    if (institutionsRaw === undefined)
        return next(new ParameterError('Missing parameter', {'institution': institutionsRaw} ));

    let courseParts = course.split(' ');
    if (courseParts.length !== 2)
        return next(new ParameterError('Malformed course', {'course': course }));

    let subject = courseParts[0];
    if (!validateSubject(subject))
        return next(new ParameterError('Malformed course subject', {'course': course}));

    let number = courseParts[1];
    if (!validateNumber(number))
        return next(new ParameterError('Malformed course number', {'course': course}))

    let institutions = institutionsRaw.split(',');

    queries.equivalenciesForCourse(subject, number, institutions).then(function(doc) {
        res.json(doc);
    }).catch(function(err) {
        next(new ParameterError('Invalid course', {'subject': subject, 'number': number} ));
    });
});

/**
 * Gets the entirety of the institutions collection
 */
router.get('/institutions', function(req, res, next) {
    queries.listInstitutions().then(function(institutions) {
        res.json(institutions);
    }).catch(function(err) {
        return next(new GeneralApiError('Something went wrong'));
    });
});

router.get('/institution/:institution/:courses', function(req, res, next) {
    let institution = util.normalizeWhitespace(req.params.institution).toUpperCase();
    if (!validateInstitutionAcronym(institution))
        return next(new ParameterError('Malformed institution acronym', {'institution': institution}))

    let coursesRaw = util.normalizeWhitespace(req.params.courses);
    let coursesParts = coursesRaw.split(',');
    let courses = [];

    for (let i = 0; i < coursesParts.length; i++) {
        let parts = util.normalizeWhitespace(coursesParts[i]).split(' ');

        if (parts.length !== 2)
            return next(new ParameterError('Malformed course', {
                'courses': coursesRaw,
                'parts': parts,
                'index': i
            }));

        if (!validateSubject(parts[0]))
            return next(new ParameterError('Malformed course subject', {
                'courses': coursesRaw,
                'parts': parts,
                'index': i
            }));

        if (!validateNumber(parts[1]))
            return next(new ParameterError('Malformed course number', {
                'courses': coursesRaw,
                'parts': parts,
                'index': i
            }));

        courses.push({
            subject: parts[0],
            number: parts[1]
        });
    }

    queries.equivalenciesForInstitution(institution, courses).then(function(data) {
        res.json(data);
    }).catch(function(err) {
        return next(new GeneralApiError('Something went wrong'))
    })
});

// Error handling
router.use('/', function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err);
});

function validateSubject(subj) {
    return subjectRegex.test(subj);
}

function validateNumber(num) {
    return numberRegex.test(num);
}

function validateInstitutionAcronym(inst) {
    return institutionRegex.test(inst);
}

function GeneralApiError(reason, status = 400) {
    this.reason = reason;
    this.status = status;
}

function ParameterError(reason, parameters, status = 400) {
    this.reason = reason;
    this.parameters = parameters;
    this.status = status;
}

module.exports = router;
