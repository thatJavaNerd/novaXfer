const mongodb = require('mongodb');
const ObjectID = require('mongodb').ObjectID;
const request = require('request');
const assert = require('assert');
const indexers = require('./indexers');

const mongoUrl = 'mongodb://localhost:27017/novaXfer'
const MongoClient = mongodb.MongoClient;

module.exports.index = function() {

    // Find all our university course equivalency indexers
    indexers.findIndexers(function(err, paths) {
        const indexers = [];
        for (let i = 0; i < paths.length; i++) {
            indexers[i] = require(paths[i]);
        }

        // Connect to our mongo instance
        MongoClient.connect(mongoUrl, function(err, db) {
            assert.equal(null, err)

            var courses = db.collection('courses');

            // Keep track of how many indexers have finished
            var finished = 0;

            console.log(`Indexing ${indexers.length} institutions...`);

            for (let i = 0; i < indexers.length; i++) {
                var indexer = indexers[i];
                indexer.findAll(err, function(err, equivalency) {
                    assert.equal(null, err);

                    // Make some adjustments to comply to our BSON schema
                    equivalency.other.institution = equivalency.otherCollegeName;

                    // Upsert the equivalency
                    courses.updateOne(
                        {number: equivalency.vccs.number},
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
                }, function(err) {
                    if (++finished == indexers.length) {
                        console.log('Done.');
                        db.close();
                    }

                    if (err != null) {
                        throw err;
                    }
                });
            }
        });
    });
}
