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
        return Promise.all(indexers.map(ind =>
            require(ind).findAll().catch(function(err) {
                throw err;
            })
        ));
    }).then(function(contexts) {
        let totalCourses = 0;
        for (let context of contexts) {
            totalCourses += context.equivalencies.length;
        }

        return {
            equivalencyContexts: contexts,
            institutionsIndexed: contexts.length,
            coursesIndexed: totalCourses
        };
    });
};
