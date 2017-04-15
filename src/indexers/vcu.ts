import * as util from '../util';
import { Indexer } from './index';
import { Course, CourseEquivalency } from '../models';


export default class VcuIndexer extends Indexer<any> {
    protected prepareRequest(): any {
        return 'https://apps.sem.vcu.edu/feeds/transfer/courses/VCCS';
    }

    protected parseBody(data: Buffer): Promise<any> {
        return JSON.parse(data.toString('utf8'));
    }

    protected parseEquivalencies(body: any): CourseEquivalency[] {
        const equivalencies: CourseEquivalency[] = [];

        for (let equivalency of body) {
            const inputMatrix = parseRawCourses(equivalency.Transfer);
            const outputMatrix = parseRawCourses(equivalency.VCU);

            for (let input of inputMatrix) {
                for (let output of outputMatrix) {
                    equivalencies.push(
                        new CourseEquivalency(input, output, util.determineEquivType(output)));
                }
            }
        }

        return equivalencies;
    }

    institution = {
        acronym: 'VCU',
        fullName: 'Virginia Commonwealth University',
        location: 'Virginia'
    };
}

function parseRawCourses(courseListStruct) {
    return parseCourses(courseListStruct.CourseNumber, courseListStruct.CreditHours);
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
    const courses = courseStr.split(/ ?(?:and|or) ?/i);

    let containsOr = courseStr.indexOf('or') !== -1;
    let containsAnd = courseStr.indexOf('and') !== -1;
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
        const unbalancedCourses = [].concat.apply([], courseStr.split(/ ?or ?/i).map(course => parseCourses(course, creditsStr)));

        // In practice only two elements in array. The base is all of the
        // courses up until the course right before the 'or'. Example:
        // "HIS-101 and HIS-102 or OTHER-123". HIS-101 is the base, and HIS-102
        // and HIS-123 will be appended separately to the base to form the
        // return matrix
        const base = unbalancedCourses[0].slice(0, unbalancedCourses[0].length - 1);

        const firstBranch = base.slice(0); // slice(0) is faster than slice()
        // Add our first pivot course located at the end of the first part of
        // our divided course list
        firstBranch.push(unbalancedCourses[0][unbalancedCourses[0].length - 1]);

        const secondBranch = base.slice(0);
        // Add our second pivot course located at the start of the second list
        secondBranch.push(unbalancedCourses[1][0]);
        return [firstBranch, secondBranch];
    }
}

function parseCourse(courseStr, creditsStr): Course {
    const parts = courseStr.split('-');
    return {
        subject: parts[0].trim(),
        number: parts[1].trim(),
        credits: util.interpretCreditInput(creditsStr)[0]
    };
}
