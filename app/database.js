var MongoClient = require('mongodb').MongoClient;

var state = {
    db: null,
    mode: null
};

// https://www.terlici.com/2014/09/15/node-testing.html

const TEST_URI = 'mongodb://127.0.0.1:27017/novaXfer_test';
const PRODUCTION_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/novaXfer';

module.exports.MODE_TEST = 'mode_test';
module.exports.MODE_PRODUCTION = 'mode_production';

module.exports.connect = function(mode, done) {
    // Already connected
    if (state.db) return done();

    var uri = mode === exports.MODE_TEST ? TEST_URI : PRODUCTION_URI;

    MongoClient.connect(uri, function(err, db) {
        if (err) return done(err);
        state.db = db;
        state.mode = mode;
        done();
    });
};

module.exports.mongo = function() {
    return state.db;
};
