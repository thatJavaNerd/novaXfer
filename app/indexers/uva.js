var cheerio = require('cheerio');
var models = require('../models.js');
var util = require('../util.js');
var normalizeWhitespace = util.normalizeWhitespace;
var request = util.request;

const dataUrl = 'http://saz-webdmz.eservices.virginia.edu/asequivs/Main1/GetEquivsGivenSchool?schoolDropDownList=Northern+Virginia+Cmty+College+Annandale';
const institution = new models.Institution('UVA', 'University of Virginia');
const headerRows = 2;
const nvccIndex = 1; // CSS queries are 1-indexed
const uvaIndex = 2;

function findAll(done) {
    return request(dataUrl, institution).then(parseEquivalencies);
}

function parseEquivalencies(body) {
    return new Promise(function(fulfill, reject) {
        var $ = cheerio.load(body);
        var equivalencies = [];

        var rows = $('table tr').slice(headerRows);
        rows.each(function(index, element) {
            var rowType = getRowType($(this));

            switch (getRowType($(this))) {
                case 'unknown':
                    reject(new Error("Found row with type 'unknown'"));
                    return false;
                case 'empty':// This is a row to separate courses, skip
                case 'input':
                case 'output':
                    // We handle supplement and freebie rows when their base
                    // courses are found
                    return true;
            }

            var nvccCourses = [ parseCourse($(this), nvccIndex) ];
            var uvaCourses = [ parseCourse($(this), uvaIndex) ];

            var eq = new models.CourseEquivalency(nvccCourses, uvaCourses, institution);

            if (index + 1 < rows.length) {
                // Possibility of extraneous row
                var nextRowType = getRowType($(rows[index + 1]));
                if (nextRowType === 'unknown') {
                    reject("Found row with type 'unknown'");
                    return false;
                }
                if (nextRowType === 'input' || nextRowType === 'output') {
                    // Add a supplement
                    var columnIndex = nvccIndex; // Assume input course
                    if (nextRowType === 'output')
                        index = uvaIndex;
                    eq[nextRowType].push(parseCourse($(rows[index + 1]), columnIndex));
                }
            }

            equivalencies.push(eq);
        });

        // Since $.each is synchronous we can call done() when outside that block
        fulfill(equivalencies);
    });
}

function parseCourse($tr, index) {
    var baseStr = normalizeWhitespace($tr.children(`td:nth-child(${index})`)
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

/**
 * Identifies the type of data present in the given row.
 *
 * Returns:
 *   'normal' => NVCC and UVA course present
 *   'input' => Specifies extra NVCC course to take to get credit for the UVA
 *              course in the above row.
 *   'output' => Specifies extra UVA course one would get credit for if they
 *               also got credit for the NVCC course specified in the above
 *               row.
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
        return 'input';
    if (nvccColumn === '' && uvaColumn !== '')
        return 'output';
    return 'unknown';
}

module.exports.findAll = findAll;
module.exports.institution = institution;
