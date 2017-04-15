import { PdfIndexer } from './index';
import {
    Course,
    CourseEquivalency,
    CREDITS_UNKNOWN,
} from '../models';
import { determineEquivType } from '../util';

const subjectRegex = /^[A-Z]{3}$/;
// Tests if the entirety of a string represents a valid course identifier.
// Example: http://regexr.com/3estr
const courseStringTester = /^(?:([A-Z]{2,4} ?)?([0-9LX]{2,4})(?: & |\/ ?)?)+$/;
// Capture course identifier parts
// Example: http://regexr.com/3esti
const courseStringSeparator = /([A-Z]{3,4} ?)?([0-9LX]{3,4})/g;
const defaultCnuCourseIndex = 4;

export default class CnuIndexer extends PdfIndexer {
    protected prepareRequest(): any {
        return 'http://cnu.edu/admission/transfer/_pdf/cnu-vccs-cnu_equivalent_course_table_02152017_kw.pdf';
    }

    protected parseEquivalencies(rows: string[][]): CourseEquivalency[] {
        const equivalencies: CourseEquivalency[] = [];
        for (let row of rows) {
            if (subjectRegex.test(row[0])) {
                // NVCC is pretty convenient
                const nvccCourses = parseNvccCourses(row);

                // CNU isn't
                let cnuCourses: Course[] | null = null;
                for (let i = defaultCnuCourseIndex; i < row.length; i++) {
                    // Look for a cell represents the CNU course
                    const base = row[i].trim();
                    if (courseStringTester.test(base)) {
                        cnuCourses = parseCnuCourses(base);
                        break;
                    }

                    // Sometimes the full identifier can't fit on a single row,
                    // search the next row as well.
                    if (i + 1 < row.length) {
                        const appended = base + ' ' + row[i + 1].trim();
                        if (courseStringTester.test(appended)) {
                            cnuCourses = parseCnuCourses(appended);
                            break;
                        }
                    }
                }

                equivalencies.push(new CourseEquivalency(
                    nvccCourses, cnuCourses!, determineEquivType(cnuCourses!)));
            }
        }

        return equivalencies;
    }

    institution = {
        acronym: 'CNU',
        fullName: 'Christopher Newport University',
        location: 'Virginia'
    };
}

function parseNvccCourses(row) {
    let courseNumbers = row[1].split(/[-+]/);
    const courses: Course[] = [];
    let creditsUsed = false;
    for (let courseNumber of courseNumbers) {
        let credits = CREDITS_UNKNOWN;
        if (!creditsUsed) {
            credits = parseInt(row[2]);
            creditsUsed = true;
        }
        courses.push({
            subject: row[0],
            number: courseNumber,
            credits: parseInt(row[2], 10)
        });
    }

    return courses;
}

function parseCnuCourses(rawString): Course[] {
    let matchedCourses = rawString.match(courseStringSeparator);
    const courses: Course[] = [];

    // Split each match by a space and flat map. For example:
    // ['CHEM 104', '104L'] => ['CHEM', '104', '104L']
    matchedCourses = [].concat.apply([], matchedCourses.map(course => separateCourseParts(course)));

    let subject = matchedCourses[0];
    for (let i = 1; i < matchedCourses.length; i++) {
        if (/[A-Z]/.test(matchedCourses[i][0])) {
            // First letter is alphabetical, assume subject
            subject = matchedCourses[i];
        } else {
            // First letter is non-alphabetical, assume course number
            courses.push({
                subject: subject,
                number: matchedCourses[i],
                credits: CREDITS_UNKNOWN
            });
        }
    }

    return courses;
}

function separateCourseParts(raw) {
    if (raw.indexOf(' ') !== -1)
        return raw.split(' ');

    const firstNumber = raw.search(/\d/);
    if (firstNumber === 0)
        return [raw];
    return [raw.slice(0, firstNumber), raw.slice(firstNumber)];
}

