const request = require('request');
const assert = require('assert');
const cheerio = require('cheerio');
const models = require('../models.js');
const regexUtil = require('../util/regex.js');

const dataUrl = 'http://saz-webdmz.eservices.virginia.edu/asequivs/Main1/GetEquivsGivenSchool?schoolDropDownList=Northern+Virginia+Cmty+College+Annandale';
const institution = 'University of Virginia';
const headerRows = 2;

function findAll(err, each, done) {
    request(dataUrl, function(err, response, body) {
        assert.equal(null, err);
        var $ = cheerio.load(body);

        var rows = $('table tr').slice(headerRows, 16);
        rows.each(function(index, element) {
            if ($(this).text().trim() === '') {
                // This is a row to separate courses, skip
                return true;
            }
            if (isAdditionalCourseRow($(this))) {
                // We just handled this row in a previous iteration
                return true;
            }

            let nvcc = new models.Course(parseNvccNumber($(this), -1));

            var uvaFullText = removeStupidWhitespace($(this).children('td:nth-child(2)').text());

            if (uvaFullText.replace(String.fromCharCode(160), '').trim() == "(nocredit)") {
                // UVA doesn't offer credit for this course, make up our own
                // course number
                var uva = new models.Course("NONE", 0);
            } else {
                var uvaNumberColumn = $(this).children('td:nth-child(2)');
                var uvaCourseParts = removeStupidWhitespace(uvaNumberColumn.text())
                        .split(String.fromCharCode(160));
                var uva = new models.Course(
                    uvaCourseParts[0] + " " + uvaCourseParts[1],
                    parseInt(uvaCourseParts[2])
                );
            }

            let eq = new models.CourseEquivalency(nvcc, uva, institution);

            if (index + 1 < rows.length && isAdditionalCourseRow($(rows[index + 1]))) {
                // Add a supplement
                eq.other.supplement = parseNvccNumber($(rows[index + 1]));
            }

            return each(null, eq);
        });

        // Since $.each is synchronous we can call done() when outside that block
        return done();
    });
}

/** Parses the first column in the given row as a course number string */
function parseNvccNumber($tr) {
    var base = removeStupidWhitespace($tr.children('td:nth-child(1)').text());
    return base.substring(0, base.length - 1);
}

function removeStupidWhitespace(text) {
    return text.replace(regexUtil.newline, '').replace(/ /g, '');
}

/**
 * Returns true if this row is used to specify an additional class that can be
 * taken with the class specified at the row above for more credit.
 */
function isAdditionalCourseRow($tr) {
    // The first column should specify the NVCC course, the second should be
    // empty.
    return $tr.children('td:nth-child(2)').text().trim() === '' &&
            $tr.children('td:nth-child(1)').text().trim() !== '';
}

module.exports.findAll = findAll;
module.exports.institution = institution;
