var Promise = require('promise');
var request = require('request');
var nbsp = String.fromCharCode(160);

module.exports = {
    /**
     * Replaces all sequences of new line, nbsp, and space characters with a
     * single space.
     */
    normalizeWhitespace: function(text) {
        return text.replace(new RegExp(`(?:\r\n|\r|\n|${nbsp}| )+`, 'g'), ' ').trim();
    },
    request: function(requestData) {
        return new Promise(function(fulfill, reject) {
            request(requestData, function(err, response, body) {
                if (err) return reject(err);
                if (response.statusCode !== 200)
                    return reject(new Error(`Bad status code: ${response.statusCode}`));

                return fulfill(body);
            });
        });
    }
};
