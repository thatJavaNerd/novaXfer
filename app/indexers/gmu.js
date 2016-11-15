const request = require('request');
const models = require('../models.js');
const cheerio = require('cheerio');
const fs = require('fs');

const dataUrl = 'http://admissions.gmu.edu/transfer/transfercreditsearch.asp?state=VA&school=USVCCS&course=View+All';
const institution = 'George Mason University';
const headerRows = 8;

const nvccNumberIndex = 0;
const nvccCreditsIndex = 2;
const gmuNumberIndex = 3;
const gmuCreditsIndex = 5;

/**
 * Finds all course equivalencies publicly listed for GMU.
 *
 * @param each Function that is supplied a course equivalency every time a new
 *             one is found.
 * @param done Function that is supplied an error if one is encountered
 */
function findAll(each, done) {
    request(dataUrl, function(err, response, body) {
        if (err)
            return done(err);

        var $ = cheerio.load(body);

        var $rows = $('#contentPrimary tr').slice(headerRows);
        $rows.each(function() {
            var vals = $(this).children('td').map(function() { return $(this).text(); });

            var nvcc = parseCourse(vals, nvccNumberIndex, nvccCreditsIndex);
            var gmu = parseCourse(vals, gmuNumberIndex, gmuCreditsIndex);

            each(new models.CourseEquivalency(nvcc, gmu, institution));
        });
        return done(null);
    });
}

function parseCourse(vals, numberIndex, creditsIndex) {
    // Course will sometimes look something like this: "ACCT-----", where the
    // subject is "ACCT" and the number is "----", replace first hyphen with a
    // space and then split.
    var parts = vals[numberIndex].replace('-', ' ').split(' ');
    return new models.Course(parts[0], parts[1], parseInt(vals[creditsIndex]));
}


module.exports.findAll = findAll;
module.exports.institution = institution;
