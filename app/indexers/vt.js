const request = require('request');
const models = require('../models.js')

const dataUrl = "https://spreadsheets.google.com/feeds/list/1an6vCkT9eKy7mvYHF8RSpkUKFaYK5DCjFC6sua3QaNU/od6/public/values?alt=json"
const institution = "Virginia Tech"

function findAll(each, done) {
    request(dataUrl, function(err, response, body) {
        if (err)
            return done(err);

        var equivalencies = [];
        var entries = JSON.parse(body).feed.entry;
        for (let i = 0; i < entries.length; i++) {
            var entry = entries[i];

            // Some classes that don't have direct equivalents will be listed
            // as either '2xxx' or '2XXX' (2 could be any number), make sure
            // our input is uniform
            var vtNumber = entry["gsx$vtcoursenumber"]["$t"].toUpperCase();
            // No credit awarded or only in special circumstances
            if (vtNumber === '')
                vtNumber = 'NONE 000';

            var vtCredits = parseCredits(entry["gsx$vtcredits"]["$t"]);
            var vt = new models.Course(vtNumber, vtCredits);

            var vccsNumber = entry["gsx$vccscoursenumber"]["$t"];
            var vccsCredits = parseCredits(entry["gsx$vccscredits"]["$t"]);

            // There is a very specific entry which tells the reader to refer
            // to another site for ENGE equivalents. Ignore this entry.
            if (entry["gsx$vccscoursetitle"]["$t"] === '' &&
                    entry["gsx$vtcoursetitle"]["$t"] === '')
                continue;

            // The VT transfer site lists entire subjects ("MTH"), specific
            // courses ("MTH 173"), and courses that must be taken together that
            // have a different equivalency than if they were taken
            // individually ("MTH 175 + 176"). For right now, we only care about
            // specific courses.
            if (vccsNumber.indexOf("+") != -1 || /^[a-zA-Z]+$/.test(vccsNumber))
                continue;

            var vccs = new models.Course(vccsNumber, vccsCredits);
            each(new models.CourseEquivalency(vccs, vt, institution));
        }

        return done();
    });
}

// Sometimes credits will be listed in a range ("3-4")
function parseCredits(str) {
    if (str === '')
        return -1;

    if (str.indexOf('-') == -1)
        return parseInt(str);
    var creditSegments = str.split('-');
    return {
        min: parseInt(creditSegments[0]),
        max: parseInt(creditSegments[1])
    };
}

module.exports.findAll = findAll
module.exports.institution = institution
