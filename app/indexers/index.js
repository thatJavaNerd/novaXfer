const fs = require('fs');
const path = require('path');

/**
 * Finds the names of all the built in university indexers (JS files in
 * <root>/app/indexers/).
 */
module.exports.findIndexers = function(done) {
    fs.readdir(__dirname, function(err, items) {
        if (err) {
            return done(err);
        }

        var indexers = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.endsWith(".js") && item != "index.js") {
                indexers.push(path.join(__dirname, item));
            }
        }

        done(null, indexers);
    });
}

module.exports.index = function(each, done) {
    // Find all our university course equivalency indexers
    module.exports.findIndexers(function(err, paths) {
        const indexers = [];
        for (let i = 0; i < paths.length; i++) {
            indexers[i] = require(paths[i]);
        }

        // Keep track of how many indexers have finished
        var finished = 0;
        var courseCount = 0;

        for (let i = 0; i < indexers.length; i++) {
            var indexer = indexers[i];
            indexer.findAll(function(err, equivalency) {
                each(equivalency, indexer.institution);
                courseCount++;
            }, function(err) {
                if (err != null) {
                    return done(err);
                }

                if (++finished == indexers.length) {
                    var report = {
                        institutionsIndexed: indexers.length,
                        coursesIndexed: courseCount
                    }
                    return done(null, report);
                }
            });
        }
    });
}
