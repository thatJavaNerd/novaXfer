import { determineEquivType, PdfIndexer } from './index';

import {
    Course, CourseEquivalency, CREDITS_UNKNOWN
} from '../models';

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

export default class WmIndexer extends PdfIndexer {
    public institution = {
        acronym: 'W&M',
        fullName: 'William & Mary',
        location: 'Virginia',
        parseSuccessThreshold: 0.9965
    };

    protected prepareRequest(): any {
        return 'http://www.wm.edu/offices/registrar/documents/transfer/vccs_transfer_guide_table.pdf';
    }

    protected parseEquivalencies(rows: string[][]): [CourseEquivalency[], number] {
        const equivalencies: CourseEquivalency[] = [];

        let unparsableCount = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            // Test NVCC course description cell (index 0) to see if we can parse
            // this row as a course

            // Search for the NVCC data. Usually everything can be found in the
            // first element, but sometimes the PDF parser splits it in two.
            const nvccData = findGeneratorElement('', row, nvccPartsRegex);
            if (nvccData === null)
                continue;

            const nvcc = parseNvccCourses(nvccData);

            const applicableElements = row.slice(1);
            let specialOrUnclearEquivalency = false,
                wmData = null;

            // Don't operate on special or unclear equivalencies
            for (const elem of applicableElements) {
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
                const partialMatch = findGeneratorElement('', applicableElements, wmCourseTester);

                if (partialMatch)
                    wmData = findGeneratorElement(partialMatch, rows[i + 1], wmPartsRegex);
            }

            if (!wmData) {
                // PDF parsing is hell. I've gotten 99% of this data and trying to
                // parse that one course that is an exception to the exception to
                // the exception is ludicrous
                unparsableCount++;
                continue;
            }

            const wmMatrix = parseWmCourseMatrix(wmData);
            for (const wm of wmMatrix)
                equivalencies.push(new CourseEquivalency(nvcc, wm, determineEquivType(wm, 'ELT')));

        }

        return [equivalencies, unparsableCount];
    }
}

/**
 * Generator function that first iterates through all of the elements
 * individually and then iterates through them again, appending the first to the
 * second, the second to the third, etc.
 */
function* testStringGenerator(base, elements) {
    for (const elem of elements)
        yield base + elem;

    for (let i = 0; i < elements.length - 1; i++) {
        yield base + elements[i] + elements[i + 1];
        yield base + elements[i] + ' ' + elements[i + 1];
    }
}

function findGeneratorElement(base, elements, regex) {
    const gen = testStringGenerator(base, elements);
    while (true) {
        const next = gen.next();
        if (next.done) break;

        if (regex.test(next.value)) {
            return next.value;
        }
    }

    return null;
}

function parseNvccCourses(raw): Course[] {
    // [0] is full matched text, [1] through [length] are subjects/numbers
    const parts = raw.match(nvccPartsRegex);
    const subject = parts[1];
    const courses: Course[] = [{
        subject,
        number: parts[2],
        credits: CREDITS_UNKNOWN
    }];

    if (parts[3] !== undefined) {
        courses.push({
            subject,
            number: parts[3],
            credits: CREDITS_UNKNOWN
        });
    }

    return courses;
}

function parseWmCourseMatrix(raw): Course[][] {
    const matches = raw.match(wmPartsRegex);

    if (!matches) throw new Error(`No matches on '${raw}'`);

    // `credits` is the last capture group, use it if available
    const credits = matches[matches.length - 1] ?
        parseInt(matches[matches.length - 1], 10) : CREDITS_UNKNOWN;

    const courses: Course[][] = [[{
        subject: matches[1] as string,
        number: matches[2] as string,
        credits
    }]];

    // 4th index is the course number. If defined, matches[4] is the subject. If
    // not, matches[4] is the course number, matches[1]is the subject.
    const subject = matches[4] ? matches[3] : matches[1];
    const numb = matches[5] ? matches[4] : matches[3];
    const secondCourse: Course = {
        subject,
        number: numb,
        credits
    };
    // Create another output array for a whole new equivalency
    if (raw.indexOf(' or ') !== -1) {
        courses.push([secondCourse]);
    } else if (raw.indexOf(', ') !== -1 || raw.indexOf('/') !== -1) {
        // Simply append to the existing output array
        courses[0].push(secondCourse);
    }

    return courses;
}
