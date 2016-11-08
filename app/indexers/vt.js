const request = require('request');
const models = require('../models.js')

const dataUrl = "https://spreadsheets.google.com/feeds/list/1an6vCkT9eKy7mvYHF8RSpkUKFaYK5DCjFC6sua3QaNU/od6/public/values?alt=json"
const institution = "Virginia Tech"

function findAll(err, each, done) {
    request(dataUrl, function(error, response, body) {
        if (err) {
            return done(err);
        }

        var equivalencies = [];
        var entries = JSON.parse(body).feed.entry;
        for (let i = 0; i < entries.length; i++) {
            var entry = entries[i];

            var vtNumber = entry["gsx$vtcoursenumber"]["$t"];
            var vtCredits = entry["gsx$vtcredits"]["$t"];
            var vt = new models.Course(vtNumber, vtCredits);

            var vccsNumber = entry["gsx$vccscoursenumber"]["$t"];
            var vccsCredits = entry["gsx$vccscredits"]["$t"];

            // The VT transfer site lists entire subjects ("MTH"), specific
            // courses ("MTH 173"), and courses that must be taken together that
            // have a different equivalency than if they were taken
            // individually ("MTH 175 + 176"). For right now, we only care about
            // specific courses.
            if (vccsCredits === "" || vccsNumber.indexOf("+") != -1)
                continue;

            var vccs = new models.Course(vccsNumber, vccsCredits);
            each(null, new models.CourseEquivalency(vccs, vt, institution));
        }

        return done();
    });
}

module.exports.findAll = findAll
module.exports.institution = institution
