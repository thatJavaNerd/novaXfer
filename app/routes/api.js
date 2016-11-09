var express = require('express');
var router = express.Router();
var assert = require('assert');

router.get('/courses/:subject', function(req, res, next) {
    var coll = req.app.get('db').collection('courses');
    coll.find({number: new RegExp("^" + req.params.subject, 'i')})
        .sort({number: 1})
        .toArray(function(err, docs) {
            assert.equal(null, err);
            res.json(docs);
        });
});

module.exports = router;
