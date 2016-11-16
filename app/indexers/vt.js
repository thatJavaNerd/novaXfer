const request = require('request');
const models = require('../models.js');

const dataUrl = "https://spreadsheets.google.com/feeds/list/1an6vCkT9eKy7mvYHF8RSpkUKFaYK5DCjFC6sua3QaNU/od6/public/values?alt=json";

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
            var vtCourseStr = entry.gsx$vtcoursenumber.$t.toUpperCase();
            var vtCourse = null;
            var vtNumber = null;
            // No credit awarded or only in special circumstances
            if (vtCourseStr === '') {
                vtCourse = 'NONE';
                vtNumber = '000';
            } else {
                var parts = vtCourseStr.split(' ');
                vtCourse = parts[0];
                vtNumber = parts[1];
            }

            var vtCredits = parseCredits(entry.gsx$vtcredits.$t);
            var vt = new models.Course(vtCourse, vtNumber, vtCredits);

            var nvccCourseStr = entry.gsx$vccscoursenumber.$t;
            var nvccNumber = entry.gsx$vccscoursenumber.$t;
            var nvccCredits = parseCredits(entry.gsx$vccscredits.$t);

            // There is a very specific entry which tells the reader to refer
            // to another site for ENGE equivalents. Ignore this entry.
            if (entry.gsx$vccscoursetitle.$t === '' &&
                    entry.gsx$vtcoursetitle.$t === '')
                continue;

            // TODO add supplement to equivalency
            // The VT transfer site lists entire subjects ("MTH"), specific
            // courses ("MTH 173"), and courses that must be taken together that
            // have a different equivalency than if they were taken
            // individually ("MTH 175 + 176"). For right now, we only care about
            // specific courses.
            if (nvccCourseStr.indexOf("+") != -1 || /^[a-zA-Z]+$/.test(nvccNumber))
                continue;

            var nvccParts = nvccCourseStr.split(' ');
            var nvcc = new models.Course(nvccParts[0], nvccParts[1], nvccCredits);
            each(new models.CourseEquivalency(nvcc, vt, module.exports.institution));
        }

        return done(null);
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

module.exports.findAll = findAll;
module.exports.institution = "Virginia Tech";
