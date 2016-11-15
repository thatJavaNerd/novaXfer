const request = require('request');
const assert = require('assert');
const cheerio = require('cheerio');
const models = require('../models.js');
const regexUtil = require('../util/regex.js');

const dataUrl = 'http://saz-webdmz.eservices.virginia.edu/asequivs/Main1/GetEquivsGivenSchool?schoolDropDownList=Northern+Virginia+Cmty+College+Annandale';
const institution = 'University of Virginia';
const headerRows = 2;
const nvccIndex = 1; // CSS queries are 1-indexed
const uvaIndex = 2;

function findAll(each, done) {
    request(dataUrl, function(err, response, body) {
        assert.equal(null, err);
        var $ = cheerio.load(body);

        var error = null;
        var rows = $('table tr').slice(headerRows);
        rows.each(function(index, element) {
            var rowType = getRowType($(this));

            switch (getRowType($(this))) {
                case 'unknown':
                    error = "Found row with type 'unknown'";
                    return false;
                case 'empty':// This is a row to separate courses, skip
                case 'supplement':
                case 'freebie':
                    // We handle supplement and freebie rows when their base
                    // courses are found
                    return true;
            }

            var vccs = parseCourse($(this), 1);
            var uva = parseCourse($(this), uvaIndex);

            var eq = new models.CourseEquivalency(vccs, uva, institution);


            if (index + 1 < rows.length) {
                // Possibility of extraneous row
                var nextRowType = getRowType($(rows[index + 1]));
                if (nextRowType === 'unknown') {
                    error = "Found row with type 'unknown'";
                    return false;
                }
                if (nextRowType === 'supplement' || nextRowType === 'freebie') {
                    // Add a supplement
                    var columnIndex = nvccIndex; // Assume supplement
                    if (nextRowType === 'freebie')
                        index = uvaIndex;
                    eq.other[nextRowType] = parseCourse($(this), columnIndex);
                }
            }

            return each(eq);
        });

        // Since $.each is synchronous we can call done() when outside that block
        return done(error);
    });
}

function parseCourse($tr, index) {
    var baseStr = removeStupidWhitespace($tr.children(`td:nth-child(${index})`)
            .text());
    if (baseStr === '(no credit)') {
        // UVA doesn't offer credit for this course, make up our own
        // course number
        return new models.Course("NONE", "000", 0);
    }

    // Business as usual
    var parts = baseStr.split(' ');

    var credits = -1;
    if (parts.length >= 3)
        credits = parseInt(parts[2]);
    return new models.Course(parts[0], parts[1], credits);
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
 * Identifies the type of data present in the given row.
 *
 * Returns:
 *   'normal' => NVCC and UVA course present
 *   'supplement' => Specifies extra NVCC course to take to get credit for
 *                   the UVA course in the above row.
 *   'freebie' => Specifies extra UVA course one would get credit for if they
 *                also got credit for the NVCC course specified in the above
 *                row.
 *   'empty' => This row is used to visually separate other course equivalencies
 *   'unknown' => Logically shouldn't be returned so if you see this you know
 *                something's wrong.
 */
function getRowType($tr) {
    var nvccColumn = $tr.children('td:nth-child(1)').text().trim();
    var uvaColumn = $tr.children('td:nth-child(2)').text().trim();

    if (nvccColumn !== '' && uvaColumn !== '')
        return 'normal';
    if (nvccColumn === '' && uvaColumn === '')
        return 'empty';
    if (nvccColumn !== '' && uvaColumn === '')
        return 'supplement';
    if (nvccColumn === '' && uvaColumn !== '')
        return 'freebie';
    return 'unknown';
}

module.exports.findAll = findAll;
module.exports.institution = institution;
