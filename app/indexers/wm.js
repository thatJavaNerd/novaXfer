var util = require('../util.js');
var request = util.request;
var models = require('../models.js');

const dataUrl = 'http://www.wm.edu/offices/registrar/documents/transfer/vccs_transfer_guide_table.pdf';
const institution = new models.Institution('W&M', 'William & Mary');
// See http://regexr.com/3eukm for examples
const nvccPartsRegex = /^([A-Z]{3}) ([0-9]{3}) (?:(?:\+|or) ([0-9]{3}))?/;
// http://regexr.com/3eung
// This was painful.
const wmPartsRegex = /^([A-Z]{3,4}) (\d{3}[A-Z]?|[A-Z]{3}|[A-Z]\d{2})(?:(?:\/| or|,) *(\d{3}[A-Z]?|[A-Z]{2,4}|[A-Z]\d{2})(?: (\d{3}[A-Z]?|[A-Z]{3}))?)?[* ]*(?:\( ?(\d) credits?\))? ?$/;
// http://regexr.com/3eunj
const wmCourseTester = /^[A-Z]{2,4} [A-Z0-9]{2,4}/;
// http://regexr.com/3euo8
const unclearEquivalencyRegex = /NS/;
// http://regexr.com/3euo5
const specialEquivalencyRegex = /^\*+ ?$/;

function findAll() {
    return request(dataUrl, institution).then(util.parsePdf).then(parseEquivalencies);
}

function parseEquivalencies(rows) {
    var equivalencies = [];

    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        // Test NVCC course description cell (index 0) to see if we can parse
        // this row as a course

        // Search for the NVCC data. Usually everything can be found in the
        // first element, but sometimes the PDF parser splits it in two.
        let nvccData = findGeneratorElement('', row, nvccPartsRegex);
        if (nvccData === null)
            continue;

        let nvcc = parseNvccCourses(nvccData);

        let applicableElements = row.slice(1),
            specialOrUnclearEquivalency = false,
            wmData = null;

        // Don't operate on special or unclear equivalencies
        for (let elem of applicableElements) {
            if (specialEquivalencyRegex.test(elem) ||
                unclearEquivalencyRegex.test(elem))
                specialOrUnclearEquivalency = true;
        }

        // Some classes have very special handlings or unclear equivalencies
        // ('need syllabus' classes). Skip these
        if (specialOrUnclearEquivalency)
            continue;

        wmData = findGeneratorElement('', applicableElements, wmPartsRegex);

        // We haven't been able to find a direct match so far, so we're
        // gonna look for an indirect match using wmCourseTester. Once we've
        // found an indirect match, we're gonna look into the next row for
        // data to concatenate the indirect match to in order to find a
        // direct match.
        if (!wmData) {
            let partialMatch = findGeneratorElement('', applicableElements, wmCourseTester);

            if (partialMatch)
                wmData = findGeneratorElement(partialMatch, rows[i + 1], wmPartsRegex);
        }

        if (!wmData) throw `No wmData for rows[${i}]=${rows[i]}`;

        let wmMatrix = parseWmCourseMatrix(wmData);
        for (let wm of wmMatrix)
            equivalencies.push(new models.CourseEquivalency(nvcc, wm));
    }

    return new models.EquivalencyContext(institution, equivalencies);
}

/**
 * Generator function that first iterates through all of the elements
 * individually and then iterates through them again, appending the first to the
 * second, the second to the third, etc.
 */
function* testStringGenerator(base, elements) {
    for (let elem of elements)
        yield base + elem;

    for (let i = 0; i < elements.length - 1; i++) {
        yield base + elements[i] + elements[i + 1];
        yield base + elements[i] + ' ' + elements[i + 1];
    }
}

function findGeneratorElement(base, elements, regex) {
    let gen = testStringGenerator(base, elements);
    while (true) {
        let next = gen.next();
        if (next.done) break;

        if (regex.test(next.value)) {
            return next.value;
        }
    }

    return null;
}

function parseNvccCourses(raw) {
    // [0] is full matched text, [1] through [length] are subjects/numbers
    var parts = raw.match(nvccPartsRegex);
    var subject = parts[1];
    var courses = [new models.Course(subject, parts[2], models.CREDITS_UNKNOWN)];

    if (parts[3] !== undefined) {
        courses.push(new models.Course(subject, parts[3], models.CREDITS_UNKNOWN));
    }

    return courses;
}

function parseWmCourseMatrix(raw) {
    var matches = raw.match(wmPartsRegex);

    if (!matches) throw `No matches on '${raw}'`;

    let usableData = [];
    // `credits` is the last capture group, use it if available
    let credits = matches[matches.length - 1] ?
            parseInt(matches[matches.length - 1]) : models.CREDITS_UNKNOWN;

    let courses = [[new models.Course(matches[1], matches[2], credits)]];

    // 4th index is the course number. If defined, matches[4] is the subject. If
    // not, matches[4] is the course number, matches[1]is the subject.
    let subject = matches[4] ? matches[3] : matches[1];
    let number = matches[5] ? matches[4] : matches[3];
    let secondCourse = new models.Course(subject, number, credits);
    // Create another output array for a whole new equivalency
    if (raw.indexOf(' or ') !== -1) {
        courses.push([secondCourse]);
    } else if (raw.indexOf(', ') !== -1 || raw.indexOf('/') !== -1) {
        // Simply append to the existing output array
        courses[0].push(secondCourse);
    }

    return courses;
}

module.exports = {
    institution: institution,
    findAll: findAll
};
