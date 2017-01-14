var util = require('../util.js');
var request = util.request;
var models = require('../models.js');
var cheerio = require('cheerio');

const dataUrl = 'http://admissions.gmu.edu/transfer/transfercreditsearch.asp?state=VA&school=USVCCS&course=View+All';
const institution = new models.Institution('GMU', 'George Mason University', 'Virginia');
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
function findAll() {
    return request(dataUrl, institution).then(parseEquivalencies);
}

function parseEquivalencies(body) {
    var $ = cheerio.load(body);
    var equivalencies = [];

    var $rows = $('#contentPrimary tr').slice(headerRows);
    $rows.each(function() {
        var vals = $(this).children('td').map(function() { return $(this).text(); });

        var nvccCourses = parseCourses(vals, nvccNumberIndex, nvccCreditsIndex);
        var gmuCourses = parseCourses(vals, gmuNumberIndex, gmuCreditsIndex);

        equivalencies.push(new models.CourseEquivalency(
            nvccCourses, gmuCourses, util.determineEquivType(gmuCourses, '---')));
    });

    return new models.EquivalencyContext(institution, equivalencies);
}

function parseCourses(vals, numberIndex, creditsIndex) {
    // Courses will either be listed as a single course equivalency or an
    // equivalency with an additional input/output. The extra class is separated
    // by an ampersand.
    var rawCourses = vals[numberIndex].split(' & ');

    var courses = [ parseCourse(rawCourses[0], vals[creditsIndex]) ];
    if (rawCourses.length > 1)
        courses.push(parseCourse(rawCourses[1]));

    return courses;
}

function parseCourse(courseStr, creditsStr) {
    // Course will sometimes look something like this: "ACCT-----", where
    // the subject is "ACCT" and the number is "----", replace first hyphen
    // with a space and then split.
    var parts = courseStr.replace('-', ' ').split(' ');
    // PHT 102 is listed as 'PHT`-102', remove the tick
    if (parts[0].indexOf('`') === parts[0].length - 1) {
        parts[0] = parts[0].slice(0, parts[0].length - 1);
    }
    var credits = creditsStr === undefined ? -1 : parseInt(creditsStr);
    return new models.Course(parts[0], parts[1], credits);
}

module.exports.findAll = findAll;
module.exports.institution = institution;
