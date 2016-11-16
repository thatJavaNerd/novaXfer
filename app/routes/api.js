var express = require('express');
var router = express.Router();

router.get('/courses/subject/:subject', function(req, res, next) {
    var findObj = {};
    var subj = req.params.subject;
    if (!validateSubject(subj))
        return next(new ApiError('Invalid parameter', 'subject', subj));

    var coll = req.app.get('db').collection('courses');
    // INJECTION WARNING
    coll.find({subject: new RegExp('^' + subj + '$', 'i')})
        .sort({number: 1})
        .toArray(function(err, docs) {
            if (err !== null)
                return next('Unable to process request');

            res.json(docs);
        });
});

// Error handling
router.use('/', function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err);
})

function validateSubject(subj) {
    return /^[A-Z]+$/i.test(subj);
}

function ApiError(reason, parameter, value) {
    this.reason = reason;
    this.parameter = parameter;
    this.value = value;
}

module.exports = router;
