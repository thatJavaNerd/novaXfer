var db = require('./database.js');
var models = require('./models.js');
var request = require('request');
var nbsp = String.fromCharCode(160);
var fs = require('fs');
var path = require('path');
var pdf2table = require('pdf2table');

module.exports = {
    /**
     * Replaces all sequences of new line, nbsp, and space characters with a
     * single space and trims.
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
    request: function(requestData, institution, useCache = true) {
        if (institution === undefined)
            return Promise.reject('expecting an institution');

        if (!useCache || shouldSkipCache()) {
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
    },
    loadConfig: function(name) {
        return new Promise(function(fulfill, reject) {
            var cfg = `${path.resolve(__dirname)}/../config/${name}.json`;
            fs.readFile(cfg, (err, data) => {
                if (err) reject(err);
                else fulfill(JSON.parse(data));
            });
        });
    },
    /**
     * Attempts to parse one or more lists of credits.
     *
     * "3,3" => [3, 3]
     * "3-4" => [{min: 3, max:4}]
     * "3,1-5,4" => [3, {min: 1, max: 5}, 4]
     */
    interpretCreditInput: function(str) {
        // Unknown amount of credits
        if (str === '')
            return -1;

        var parts = str.replace(' ', '').split(',');
        var credits = [];

        for (var i = 0; i < parts.length; i++) {
            // A hyphen indicates that the credit is a range (ex: "3-4")
            var segment = parts[i];
            if (segment.indexOf('-') != -1) {
                var creditSegments = segment.split('-');
                var a = parseInt(creditSegments[0]);
                var b = parseInt(creditSegments[1]);

                // For some odd reason?
                if (a == b) return a;

                credits.push({
                    min: Math.min(a, b),
                    max: Math.max(a, b)
                });
            } else {
                credits.push(parseInt(segment));
            }
        }

        return credits;
    },
    /** Returns true if at least one of the courses ends with numberEnding */
    determineEquivType: function(courses, numberEnding = 'XX') {
        if (!courses)
            throw new Error('No courses passed');

        let containsGeneric = false;
        for (let course of courses) {
            if (course.number.endsWith(numberEnding)) {
                containsGeneric = true;
                break;
            }
        }

        return containsGeneric ? models.TYPE_GENERIC : models.TYPE_DIRECT;
    },
    parsePdf: function(buffer) {
        return new Promise(function(fulfill, reject) {
            pdf2table.parse(buffer, function(err, rows, rowsdebug) {
                if (err) reject(err);
                else fulfill(rows);
            });
        });
    }
};

/** Uses the request module to send an HTTP request */
function networkRequest(requestData) {
    return new Promise(function(fulfill, reject) {
        var chunks = [];
        var error = null;

        request(requestData)
        .on('response', function(response) {
            if (response.statusCode !== 200)
                error = new Error(`Bad status code: ${response.statusCode}`);
        }).on('error', function(err) {
            if (err) error = err;
        }).on('data', function(chunk) {
            chunks.push(chunk);
        }).on('end', function() {
            if (error) return reject(error);
            else return fulfill(Buffer.concat(chunks));
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
            });
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
        return new Promise(function(fulfill, reject) {
            if (err && err.code === 'ENOENT') {
                // Catch an error if when accessing a directory that doesn't exist
                fs.mkdir(dir, function(err) {
                    // Then make said directory
                    if (err) return reject(err);
                    else return fulfill(dir);
                });
            } else {
                // Some other unexpected error
                return Promise.reject(err);
            }
        });
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
