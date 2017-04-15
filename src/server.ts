import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as logger from 'morgan';
import * as path from 'path'
import * as queries from './queries';
import { Database as db, Mode } from './Database'
import { IndexReport } from './indexers/index';

const app = express();

export default function(port, forceIndex) {
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
    db.get().connect(Mode.PROD)
    .then(function() {
        return queries.shouldIndex();
    }).then(function(shouldIndex) {
        if (shouldIndex || forceIndex) {
            console.log('Indexing...');
            return queries.dropIfExists('courses')
                    .then(queries.indexInstitutions)
                    .then(function(report: IndexReport) {
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
