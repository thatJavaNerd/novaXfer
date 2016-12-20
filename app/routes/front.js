var express = require('express');
var router = express.Router();

var partialNameRegex = /^[a-z0-9]+$/;

router.get('/', function(req, res, next) {
    res.render('index');
});

// Serve partial templates for Angular. /partial/my-template retrieves the
// template at partials/my-template.pug
router.get('/partial/:name', function(req, res, next) {
    console.log(req.params.name)
    if (partialNameRegex.test(req.params.name)) {
        res.render(`partials/${req.params.name}.template.pug`)
    } else {
        next({status: 404, message: "Template Not Found"});
    }
});

module.exports = router;
