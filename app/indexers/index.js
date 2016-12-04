var fs = require('fs');
var path = require('path');

/**
 * Finds the names of all the built in university indexers (JS files in
 * <root>/app/indexers/).
 */
module.exports.findIndexers = function() {
    return new Promise(function(fulfill, reject) {
        fs.readdir(__dirname, function(err, items) {
            if (err) return reject(err);

            var indexers = [];
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item.endsWith(".js") && item != "index.js") {
                    indexers.push(path.join(__dirname, item));
                }
            }

            fulfill(indexers);
        });
    });
};

module.exports.index = function() {
    // Find all our university course equivalency indexers
    return exports.findIndexers().then(function(indexers) {
        return Promise.all(indexers.map(ind => require(ind).findAll()));
    }).then(function(equivalencies) {
        return {
            "equivalencies": equivalencies,
            institutionsIndexed: equivalencies.length,
            coursesIndexed: equivalencies.map(it => it.length).reduce((a, b) => a + b, 0)
        }
    });
};
