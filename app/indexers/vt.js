const request = require('request');
const models = require('../models.js');
const regex = require('../util/regex.js');

const dataUrl = "https://spreadsheets.google.com/feeds/list/1an6vCkT9eKy7mvYHF8RSpkUKFaYK5DCjFC6sua3QaNU/od6/public/values?alt=json";

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
            if (entry.gsx$vccscredits.$t == "")
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
            var nvccCourses = parseCourses(
                entry.gsx$vccscoursenumber.$t,
                entry.gsx$vccscredits.$t
            );

            var equiv = new models.CourseEquivalency(
                nvccCourses[0],
                vtCourses[0],
                module.exports.institution);

            if (nvccCourses.length > 1)
                equiv.other.supplements = nvccCourses.slice(1);
            if (vtCourses.length > 1)
                equiv.other.freebies = vtCourses.slice(1);

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

    // Add all identified courses here. Assume there will be at least one course
    var courses = [ new models.Course(parts[0], parts[1], parseCredits(creditsStr)) ];

    // Append additional courses to the array
    var subject = parts[0];
    for (var i = 2; i < parts.length; i++) {
        if (/[a-z]/i.test(parts[i][0])) {
            // First letter is alphabetic, assume subject
            subject = parts[i];
        } else if (parts[i][0].match(/[0-9]/i)) {
            // First letter is numeric, assume course number
            courses.push(new models.Course(subject, parts[i]));
        } else {
            console.log(courseStr);
            console.log(creditsStr);
            console.log(parts);
            throw "Invalid course segment: i=" + i + ", parts[i]=" + parts[i];
        }
    }

    return courses;
}

// function parseVtCourses(courseStr, creditsStr) {
//     // courseStr can be "SUBJ NUM" or "SUBJ NUM + SUBJ2 NUM2"
//     // (ex: "ART 1XXX + ART 1XXX")
//     var parts = courseStr.split(' ');
//     var courses = [ new models.Course(parts[0], parts[1], parseCredits(creditsStr)) ];
//
//     if (parts.length > 4) {
//         courses.push(new models.Course(parts[3], parts[4]));
//     }
//
//     return courses;
// }

// Sometimes credits will be listed in a range ("3-4")
function parseCredits(str) {
    // Unknown amount of credits
    if (str === '')
        return -1;

    // A hyphen indicates that the credit is a range (ex: "3-4")
    if (str.indexOf('-') != -1) {
        var creditSegments = str.split('-');
        return {
            min: parseInt(creditSegments[0]),
            max: parseInt(creditSegments[1])
        };
    }

    // List of credits (ex: "3,3", "3+3", "3,3,3"), sum up and return
    var sum = 0;
    // Remove all non numberical characters and sum up every digit
    var creditsStr = str.replace(/[^0-9]/g, '');
    for (var i = 0; i < creditsStr.length; i++)
        sum += parseInt(creditsStr[i], 10);

    return sum;
}

module.exports.findAll = findAll;
module.exports.institution = "Virginia Tech";
