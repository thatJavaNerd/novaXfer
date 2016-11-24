const request = require('request');
const models = require('../models.js');
const regex = require('../util/regex.js');

const dataUrl = "https://spreadsheets.google.com/feeds/list/1an6vCkT9eKy7mvYHF8RSpkUKFaYK5DCjFC6sua3QaNU/od6/public/values?alt=json";

// Detect if a course is "evaluated on an individual basis." One of the entries
// is misspelled, hence the optional second 'i'.
const individualRegex = /indivi?dual/i;

function findAll(each, done) {
    request(dataUrl, function(err, response, body) {
        if (err)
            return done(err);

        var equivalencies = [];
        var entries = JSON.parse(body).feed.entry;
        for (let i = 0; i < entries.length; i++) {
            var entry = entries[i];

            // The VT transfer site lists entire subjects ("MTH"), specific
            // courses ("MTH 173"), and courses that must be taken together that
            // have a different equivalency than if they were taken
            // individually ("MTH 175 + 176"). Skip entries dedicated to entire
            // subjects.
            if (entry.gsx$vccscredits.$t == "" || /^[a-z]{2,4}$/i.test(entry.gsx$vccscoursenumber.$t))
                continue;

            // There is a very specific entry which tells the reader to refer
            // to another site for ENGE equivalents. Ignore this entry.
            if (entry.gsx$vccscoursetitle.$t === '' &&
                    entry.gsx$vtcoursetitle.$t === '')
                continue;

            var vtCourses = parseCourses(
                // Some classes that don't have direct equivalents will be
                // listed as either 'Yxxx' or 'YXXX' (where Y is a positive
                // integer), make sure our output is uniform
                entry.gsx$vtcoursenumber.$t.toUpperCase(),
                entry.gsx$vtcredits.$t
            );

            if (vtCourses.length == 0 &&
                individualRegex.test(entry.gsx$vtcoursetitle.$t) ||
                individualRegex.test(entry.gsx$vtcoursenumber.$t))
                vtCourses = [ new models.Course("VT", "XXXX", -1) ];

            var nvccCourses = parseCourses(
                entry.gsx$vccscoursenumber.$t,
                entry.gsx$vccscredits.$t
            );

            var equiv = new models.CourseEquivalency(
                nvccCourses,
                vtCourses,
                module.exports.institution);

            each(equiv);
        }

        return done(null);
    });
}

function parseCourses(courseStr, creditsStr) {
    // courseStr formats:
    // "MTH 173"
    // "ART 103 + 104"
    // "EGR 110 + EGR 120"
    // "BLD 101, 102 & 111"
    // "BLD 101, 102 & DRF 165"
    // "BLD 231, 232, 242 & 247"
    // "CST 151 OR 152"
    // "PED 111 or 112"
    // "FOR 105 + FOR 115 + FOR 125"
    // "FOR 202 + HLT 106 + FOR 290/297"

    // Remove all non course subjects/course numbers
    // http://regexr.com/3end1
    var normalizationRegex = /(, | [&+] | or )/ig;

    // Replace all non course numbers/subjects with whitespace, normalize, and split
    var parts = regex.normalizeWhitespace(courseStr).replace(normalizationRegex, ' ').split(' ');

    var creditsArray = parseCreditsArray(creditsStr);

    // Add all identified courses here. Assume there will be at least one course
    var courses = [];

    // Append additional courses to the array
    var subject = parts[0];
    for (var i = 1; i < parts.length; i++) {
        if (/[0-9X]{2,4}/i.test(parts[i])) {
            // First letter is numeric, assume course number
            var credits = courses.length >= creditsArray.length ? -1 : creditsArray[courses.length];
            courses.push(new models.Course(subject, parts[i], credits));
        } else if (/[a-z]/i.test(parts[i][0])) {
            // First letter is alphabetic, assume subject
            subject = parts[i];
        } else {
            throw new Error("Invalid course segment: i=" + i + ", parts[i]=" + parts[i]);
        }
    }

    return courses;
}

// Sometimes credits will be listed in a range ("3-4")
function parseCreditsArray(str) {
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
            credits.push({
                min: parseInt(creditSegments[0]),
                max: parseInt(creditSegments[1])
            });
        } else {
            credits.push(parseInt(segment));
        }
    }

    return credits;
}

module.exports.findAll = findAll;
module.exports.institution = "Virginia Tech";
