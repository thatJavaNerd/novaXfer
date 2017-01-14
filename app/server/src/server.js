var bodyParser = require('body-parser');
var express = require('express');
var helmet = require('helmet');
var logger = require('morgan');
var mongodb = require('mongodb');
var path = require('path');
var queries = require('./queries.js');
var db = require('./database.js');

const app = express();

module.exports = function(port, skipIndex) {
    ///////////////////// CONFIGURATION /////////////////////
    app.set('views', path.join(__dirname, './views'));
    app.set('view engine', 'pug');
    app.use(helmet());
    app.use(logger('dev'));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, '../public')));


    //////////////////////// ROUTING ////////////////////////
    app.use('/api', require('./routes/api.js'));
    app.use('/', require('./routes/front.js'));

    ///////////////////// ERROR HANDLING ////////////////////
    // Catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // Development error handler
    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // Production error handler
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: {}
        });
    });


    ///////////////////////// START /////////////////////////
    // Connect to MongoDB
    db.connect(db.MODE_PRODUCTION).then(function() {
        if (!skipIndex) {
            console.log('Indexing...');
            return queries.dropIfExists('courses')
                    .then(queries.indexInstitutions)
                    .then(function(report) {
                        console.log(`Indexed ${report.coursesIndexed} courses from ${report.institutionsIndexed} institutions`);
                    });
        } else {
            console.log('Skipping index step. Courses may not be up to date.');
        }
    }).then(function() {
        app.listen(port);
        console.log('Magic is happening on port ' + port);
    }).catch(function(reason) {
        throw reason;
    });
};
