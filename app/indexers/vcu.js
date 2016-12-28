var util = require('../util.js');
var request = util.request;
var models = require('../models.js');
var cheerio = require('cheerio');

const dataUrl = 'http://www.transfer.vcu.edu/vccs/course-equivalency.aspx';
const vcuCourseIndex = 3;
const creditsColumnOffset = 2;

function findAll() {
    // Load the POST data from config/vcu.json and send the request
    return util.loadConfig('vcu').then(function(postData) {
        var requestData = {
            url: dataUrl,
            method: 'POST',
            form: postData
        };

        return request(requestData, module.exports.institution);
    }).then(parseEquivalencies);
}

function parseEquivalencies(body) {
    var $ = cheerio.load(body);
    var equivalencies = [];

    // Find all <tr> with CCS classes of 'even' and 'odd' within the table. The
    // rows that don't have one of these two classes are dedicated to headers.
    var tableRows = $('table.course-table tr.even,.odd');
    tableRows.each(function(index, element) {
        var equivRawData = $(this).children('td').map(function() {return $(this).text();});
        var inputMatrix = parseRawCourses(equivRawData);
        var outputMatrix = parseRawCourses(equivRawData, vcuCourseIndex);

        for (let input of inputMatrix) {
            for (let output of outputMatrix) {
                equivalencies.push(new models.CourseEquivalency(input, output));
            }
        }
    });

    return new models.EquivalencyContext(module.exports.institution, equivalencies);
}

function parseRawCourses(equivRawData, offset = 0) {
    return parseCourses(equivRawData[offset], equivRawData[offset + creditsColumnOffset]);
}

/**
 * Returns a two-dimensional array of possible course equivalencies.
 *
 * Example input/output:
 * "ENG 111"
 *     => [[ENG 111]]
 *
 * "FRLG-101 or RHAB-502"
 *     => [[FRLG 101], [RHAB 502]]
 *
 * "BIOL-152 and BIOZ-1XX and BIOZ-152 or BIOL-1XX"
 *     => [[BIOL 152, BIOZ 1XX, BIOZ 152], [BIOL 152, BIOZ 1XX, BIOL 1XX]]
 *
 * "CLSE-101 or EGRB-102 or EGRE-101 or EGRM-101"
 *     => [[CLSE 101], [EGRB 102], [EGRE 101], [EGRM 101]]
 *
 * "BIOL-300 and BIOZ-391 or BIOL-218"
 *     => [[BIOL 300, BIOZ 391], [BIOL 300, BIOL 218]]
 *
 * "MTH-175 and MTH-176 and MTH-177 and MTH-178"
 *     => [[MTH 175, MTH 176, MATH 177, MTH 178]]
 */
function parseCourses(courseStr, creditsStr) {
    var courses = courseStr.split(/ ?(?:and|or) ?/i);

    var containsOr = courseStr.indexOf('or') !== -1;
    var containsAnd = courseStr.indexOf('and') !== -1;
    if (containsOr && !containsAnd) {
        // All ors, no ands
        return courses.map(course => [parseCourse(course, creditsStr)]);
    } else if (!containsOr && containsAnd) {
        // All ands, no ors
        return [courses.map(course => parseCourse(course, creditsStr))];
    } else if (!containsOr && !containsAnd) {
        // Single course
        return [[parseCourse(courseStr, creditsStr)]];
    } else {
        // Split by 'or' and flat map each section to recursively call this
        // function as a smaller segment
        var unbalancedCourses = [].concat.apply([], courseStr.split(/ ?or ?/i).map(course => parseCourses(course, creditsStr)));

        // In practice only two elements in array. The base is all of the
        // courses up until the course right before the 'or'. Example:
        // "HIS-101 and HIS-102 or OTHER-123". HIS-101 is the base, and HIS-102
        // and HIS-123 will be appended separately to the base to form the
        // return matrix
        var base = unbalancedCourses[0].slice(0, unbalancedCourses[0].length - 1);

        var firstBranch = base.slice(0); // slice(0) is faster than slice()
        // Add our first pivot course located at the end of the first part of
        // our divided course list
        firstBranch.push(unbalancedCourses[0][unbalancedCourses[0].length - 1]);

        var secondBranch = base.slice(0);
        // Add our second pivot course located at the start of the second list
        secondBranch.push(unbalancedCourses[1][0]);
        return [firstBranch, secondBranch];
    }
}

function parseCourse(courseStr, creditsStr) {
    var parts = courseStr.split('-');
    return new models.Course(parts[0].trim(), parts[1].trim(), util.interpretCreditInput(creditsStr)[0]);
}

module.exports.findAll = findAll;
module.exports.institution =
        new models.Institution('VCU', 'Virginia Commonwealth University');
