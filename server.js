const assert = require('assert');
const bodyParser = require('body-parser');
const express = require('express');
const indexers = require('./app/indexers');
const logger = require('morgan');
const mongodb = require('mongodb')
const path = require('path');

const app = express();
const api = require('./app/routes/api');

///////////////////// CONFIGURATION /////////////////////
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'app/public')));

const port = process.env.PORT || 8080;
const mongoUrl = 'mongodb://localhost:27017/novaXfer';

//////////////// COMMAND LINE ARGUMENTS /////////////////
var doIndex = true;
process.argv.slice(2).forEach(function(val, index, array) {
    if (val === '--no-index') {
        doIndex = false;
    }
});


//////////////////////// ROUTING ////////////////////////
app.use('/api', api);


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
mongodb.MongoClient.connect(mongoUrl, function(err, db) {
    assert.equal(null, err);
    var courses = db.collection('courses');

    var start = function() {
        // Finished initializing, start up
        app.set('db', db);

        app.listen(port);
        console.log('Magic is happening on port ' + port);
    }

    if (doIndex) {
        // Index all our institutions before we start serving
        console.log("Indexing...");
        indexers.index(function(equivalency, institution) {
            // Add property for our schema
            equivalency.other.institution = equivalency.otherInstitution;
            courses.updateOne({number: equivalency.vccs.number, subject: equivalency.vccs.subject},
                {
                    $setOnInsert: {
                        credits: equivalency.vccs.credits,
                    },
                    // Add to equivalencies array if data already exists
                    $addToSet: {
                        equivalencies: equivalency.other
                    }
                },
                {upsert: true},
                function(err, result) {
                    assert.equal(null, err);
                }
            );
        }, function(err, report) {
            assert.equal(null, err);
            console.log(`Indexed ${report.coursesIndexed} courses from ${report.institutionsIndexed} institutions`)
            start();
        });
    } else {
        console.log('Skipping index step. Courses may not be up to date.');
        start();
    }
});
