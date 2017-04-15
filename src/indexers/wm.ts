import { PdfIndexer } from './index';

import * as util from '../util';
import * as models from '../models';
import {
    Course, CourseEquivalency, CREDITS_UNKNOWN,
    EquivalencyContext
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
    protected prepareRequest(): any {
        return 'http://www.wm.edu/offices/registrar/documents/transfer/vccs_transfer_guide_table.pdf';
    }

    protected parseEquivalencies(rows: string[][]): CourseEquivalency[] {
        const equivalencies: CourseEquivalency[] = [];

        let unparsableCount = 0;
        for (let i = 0; i < rows.length; i++) {
            let row = rows[ i ];
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
                    wmData = findGeneratorElement(partialMatch, rows[ i + 1 ], wmPartsRegex);
            }

            if (!wmData) {
                // PDF parsing is hell. I've gotten 99% of this data and trying to
                // parse that one course that is an exception to the exception to
                // the exception is ludicrous
                unparsableCount++;
                continue;
            }

            let wmMatrix = parseWmCourseMatrix(wmData);
            for (let wm of wmMatrix)
                equivalencies.push(new CourseEquivalency(nvcc, wm, util.determineEquivType(wm, 'ELT')));

        }

        if (unparsableCount > 0) console.log('W&M: Unable to parse ' + unparsableCount + ' courses');

        return equivalencies;
    }

    institution = {
        acronym: 'W&M',
        fullName: 'William & Mary',
        location: 'Virginia'
    };
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
        yield base + elements[ i ] + elements[ i + 1 ];
        yield base + elements[ i ] + ' ' + elements[ i + 1 ];
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

function parseNvccCourses(raw): Course[] {
    // [0] is full matched text, [1] through [length] are subjects/numbers
    const parts = raw.match(nvccPartsRegex);
    const subject = parts[ 1 ];
    const courses: Course[] = [ {
        subject: subject,
        number: parts[ 2 ],
        credits: CREDITS_UNKNOWN
    } ];

    if (parts[ 3 ] !== undefined) {
        courses.push({
            subject: subject,
            number: parts[ 3 ],
            credits: CREDITS_UNKNOWN
        });
    }

    return courses;
}

function parseWmCourseMatrix(raw): Course[][] {
    let matches = raw.match(wmPartsRegex);

    if (!matches) throw `No matches on '${raw}'`;

    // `credits` is the last capture group, use it if available
    let credits = matches[ matches.length - 1 ] ?
        parseInt(matches[ matches.length - 1 ]) : CREDITS_UNKNOWN;

    let courses: Course[][] = [ [ {
        subject: matches[ 1 ] as string,
        number: matches[ 2 ] as string,
        credits: credits
    } ] ];

    // 4th index is the course number. If defined, matches[4] is the subject. If
    // not, matches[4] is the course number, matches[1]is the subject.
    let subject = matches[ 4 ] ? matches[ 3 ] : matches[ 1 ];
    let number = matches[ 5 ] ? matches[ 4 ] : matches[ 3 ];
    let secondCourse: Course = {
        subject: subject,
        number: number,
        credits: credits
    };
    // Create another output array for a whole new equivalency
    if (raw.indexOf(' or ') !== -1) {
        courses.push([ secondCourse ]);
    } else if (raw.indexOf(', ') !== -1 || raw.indexOf('/') !== -1) {
        // Simply append to the existing output array
        courses[ 0 ].push(secondCourse);
    }

    return courses;
}
