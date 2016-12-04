var Promise = require('promise');
var db = require('./database.js');
var request = require('request');
var nbsp = String.fromCharCode(160);
var fs = require('fs');
var path = require('path');

module.exports = {
    /**
     * Replaces all sequences of new line, nbsp, and space characters with a
     * single space.
     */
    normalizeWhitespace: function(text) {
        return text.replace(new RegExp(`(?:\r\n|\r|\n|${nbsp}| )+`, 'g'), ' ').trim();
    },
    /** 'Denodeify' fs.access with Promises */
    ensureFileExists: function ensureFileExists(file) {
        return new Promise(function(fulfill, reject) {
            fs.access(file, function(fserr) {
                if (fserr) reject(fserr);
                else fulfill(file);
            });
        });
    },
    /**
     * Specialized request() wrapper for indexers. Utilizes caching when
     * specified by shouldSkipCache().
     */
    request: function(requestData, institution) {
        if (institution === undefined)
            return Promise.reject('expecting an instituiton');

        if (shouldSkipCache()) {
            // Go directly for the fresh data
            return networkRequest(requestData);
        } else {
            // Use fresh data if no cache is available
            return loadCache(institution).catch(function(err) {
                return networkRequest(requestData).then(function(contents) {
                    return saveCache(contents, institution);
                });
            });
        }
    }
};

/** Uses the request module to send an HTTP request */
function networkRequest(requestData) {
    return new Promise(function(fulfill, reject) {
        request(requestData, function(err, response, body) {
            if (err) return reject(err);
            if (response.statusCode !== 200)
                return reject(new Error(`Bad status code: ${response.statusCode}`));

            return fulfill(body);
        });
    });
}

/** Returns true if connected to the test database OR if not connected at all */
function shouldSkipCache() {
    return db.mode() !== db.MODE_TEST && db.mode() !== null;
}

/** Saves the given data to the file specified by `cacheFileForIndexer(institution)` */
function saveCache(contents, institution) {
    var cache = cacheFileForIndexer(institution);
    return mkdir(path.dirname(cache)).then(function() {
        return new Promise(function(fulfill, reject) {
            fs.writeFile(cacheFileForIndexer(institution), contents, function(err) {
                if (err) reject(err);
                else fulfill(contents);
            })
        });
    });
}

/** Reads the file specified by `cacheFileForIndexer(institution)` */
function loadCache(institution) {
    return new Promise(function(fulfill, reject) {
        fs.readFile(cacheFileForIndexer(institution), (err, data) => {
            if (err) reject(err);
            else fulfill(data);
        });
    });
}

/**
 * Makes a directory if one does not already exist. Rejects if the given file
 * descriptor exists but is not a file.
 */
function mkdir(dir) {
    // Test if the directory exists
    return module.exports.ensureFileExists(dir)
    .catch(function(err) {
        if (err && err.code === 'ENOENT') {
            // Catch an error if when accessing a directory that doesn't exist
            fs.mkdir(dir, function(err) {
                // Then make said directory
                if (err) return Promise.reject(err);
                else return Promise.resolve(dir);
            });
        } else {
            // Some other unexpected error
            return Promise.reject(err);
        }
    }).then(function() {
        // lstat(2) our fd
        return lstat(dir);
    }).then(function(stats) {
        // Make sure the directory is actually a directory
        return new Promise(function(fulfill, reject) {
            if (!stats.isDirectory()) reject('Exists, but not a directory: ' + dir);
            else fulfill(dir);
        });
    });
}

/** Wraps a Promise around async lstat(2) */
function lstat(fd) {
    return new Promise(function(fulfill, reject) {
        fs.lstat(fd, function(err, stats) {
            if (err) reject(err);
            else fulfill(stats);
        });
    });
}

function cacheFileForIndexer(institution) {
    return `${path.resolve(__dirname)}/../.cache/${institution.acronym.toLowerCase()}`;
}
