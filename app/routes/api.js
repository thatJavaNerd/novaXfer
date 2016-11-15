var express = require('express');
var router = express.Router();

router.get('/courses/subject/:subject', function(req, res, next) {
    var findObj = {};
    var subj = req.params.subject;
    if (!validateSubject(subj)) {
        // Validate the subject
        res.json(new ApiError('Invalid parameter', 'subject', subj));
        res.sendStatus(400);
    } else {
        var coll = req.app.get('db').collection('courses');
        // INJECTION WARNING
        coll.find({subject: new RegExp('^' + subj + '$', 'i')})
            .sort({number: 1})
            .toArray(function(err, docs) {
                if (err !== null) {
                    res.json({"reason": "unable to process request"});
                    res.sendStatus(500);
                } else {
                    res.json(docs);
                }
            });
    }
});

function validateSubject(subj) {
    return /^[A-Z]+$/i.test(subj);
}

function ApiError(reason, parameter, value) {
    this.reason = reason;
    this.parameter = parameter;
    this.value = value;
}

module.exports = router;
