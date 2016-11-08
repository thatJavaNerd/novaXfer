const request = require('request');
const assert = require('assert');
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

function findAll(err, each, done) {
    request(dataUrl, function(err, response, body) {
        assert.equal(null, err);
        var $ = cheerio.load(body);

        var $rows = $('#contentPrimary tr').slice(headerRows, 20);
        $rows.each(function() {
            var vals = $(this).children('td').map(function() { return $(this).text() });

            var nvcc = new models.Course(
                transformCourseNumber(vals[nvccNumberIndex]),
                parseInt(vals[nvccCreditsIndex]));

            var gmu = new models.Course(
                transformCourseNumber(vals[gmuNumberIndex]),
                parseInt(vals[gmuCreditsIndex]));

            each(null, new models.CourseEquivalency(nvcc, gmu, institution));
        });
        return done();
    });
}

/**
 * Replaces the first instance of '-' with a space. Ex: "ACC-212" -> "ACC 212"
 */
function transformCourseNumber(number) {
    return number.replace(/-/, ' ');
}


module.exports.findAll = findAll;
module.exports.institution = institution;
