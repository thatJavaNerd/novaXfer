const request = require('request');
const assert = require('assert');
const cheerio = require('cheerio');
const models = require('../models.js');
const regexUtil = require('../util/regex.js');

const dataUrl = 'http://saz-webdmz.eservices.virginia.edu/asequivs/Main1/GetEquivsGivenSchool?schoolDropDownList=Northern+Virginia+Cmty+College+Annandale';
const institution = 'University of Virginia';
const headerRows = 2;

function findAll(each, done) {
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

            var vccs = new models.Course(parseNvccNumber($(this)), -1);

            var uvaFullText = removeStupidWhitespace($(this).children('td:nth-child(2)').text());

            var uva = null;
            if (uvaFullText.replace(String.fromCharCode(160), '').trim() == "(no credit)") {
                // UVA doesn't offer credit for this course, make up our own
                // course number
                uva = new models.Course("NONE 000", 0);
            } else {
                var uvaNumberColumn = $(this).children('td:nth-child(2)');
                // Split the <td> by whitespace: [SUBJ, NUM, CREDITS]
                var uvaCourseParts = removeStupidWhitespace(uvaNumberColumn.text())
                        .split(' ');
                uva = new models.Course(
                    uvaCourseParts[0] + " " + uvaCourseParts[1],
                    parseInt(uvaCourseParts[2])
                );
            }

            let eq = new models.CourseEquivalency(vccs, uva, institution);

            if (index + 1 < rows.length && isAdditionalCourseRow($(rows[index + 1]))) {
                // Add a supplement
                eq.other.supplement = parseNvccNumber($(rows[index + 1]));
            }

            return each(eq);
        });

        // Since $.each is synchronous we can call done() when outside that block
        return done(null);
    });
}

/** Parses the first column in the given row as a course number string */
function parseNvccNumber($tr) {
    return removeStupidWhitespace($tr.children('td:nth-child(1)').text());
}

function removeStupidWhitespace(text) {
    /*
    text.trim() with newlines removed will be something like this:

        "ACC&nbsp;                211"

    Note that &nbsp; is a special whitespace character that ISN'T EQUAL TO A
    NORMAL SPACE, so we have to work some magic on this string. First, we remove
    all normal spaces ("ACC&nbsp;211") and then we replace &nbsp; with a normal
    space so we can get our formatting correct.
    */
    return text.trim().replace(regexUtil.newline, '').replace(/ /g, '').replace(new RegExp(regexUtil.nbspChar, 'g'), ' ');
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
