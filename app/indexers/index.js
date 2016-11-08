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
    })
}
