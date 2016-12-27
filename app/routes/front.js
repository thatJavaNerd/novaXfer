var express = require('express');
var router = express.Router();
var queries = require('../queries.js')

var partialNameRegex = /^[a-z0-9-]+$/;

router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/table', function(req, res, next) {
    queries.listInstitutions().then(function(institutions) {
        res.render('table', {institutions: institutions});
    });
})

// Serve partial templates for Angular. /partial/my-template retrieves the
// template at partials/my-template.template.pug
router.get('/partial/:name', function(req, res, next) {
    if (partialNameRegex.test(req.params.name)) {
        res.render(`partials/${req.params.name}.template.pug`)
    } else {
        next({status: 404, message: "Template Not Found"});
    }
});

module.exports = router;
