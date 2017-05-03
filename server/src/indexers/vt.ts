import { Course } from '../common/api-models';
import {
    determineEquivType, Indexer, interpretCreditInput,
    normalizeWhitespace
} from './index';
import { CourseEquivalency } from './models';

// Detect if a course is "evaluated on an individual basis." One of the entries
// is misspelled, hence the optional second 'i'.
const individualRegex = /indivi?dual/i;

export default class VtIndexer extends Indexer<any> {
    public institution = {
        acronym: 'VT',
        fullName: 'Virginia Tech',
        location: 'Virginia',
        parseSuccessThreshold: 1.00
    };

    protected prepareRequest(): any {
        return 'https://spreadsheets.google.com/feeds/list/' +
            '1an6vCkT9eKy7mvYHF8RSpkUKFaYK5DCjFC6sua3QaNU/od6/public/values?alt=json';
    }

    protected parseBody(data: Buffer): Promise<any> {
        return JSON.parse(data.toString('utf8'));
    }

    protected parseEquivalencies(body: any): [CourseEquivalency[], number] {
        const equivalencies: CourseEquivalency[] = [];
        const entries = body.feed.entry;
        for (const entry of entries) {
            // The VT transfer site lists entire subjects ("MTH"), specific courses
            // ("MTH 173"), and courses that must be taken together that have a
            // different equivalency than if they were taken individually
            // ("MTH 175 + 176"). Skip entries dedicated to entire subjects.
            if (entry.gsx$vccscredits.$t === '' || /^[a-z]{2,4}$/i.test(entry.gsx$vccscoursenumber.$t))
                continue;

            // There is a very specific entry which tells the reader to refer
            // to another site for ENGE equivalents. Ignore this entry.
            if (entry.gsx$vccscoursetitle.$t === '' &&
                entry.gsx$vtcoursetitle.$t === '')
                continue;

            let vtCourses = parseCourses(
                // Some classes that don't have direct equivalents will be
                // listed as either 'Yxxx' or 'YXXX' (where Y is a positive
                // integer), make sure our output is uniform
                entry.gsx$vtcoursenumber.$t.toUpperCase(),
                entry.gsx$vtcredits.$t
            );

            if (vtCourses.length === 0 &&
                individualRegex.test(entry.gsx$vtcoursetitle.$t) ||
                individualRegex.test(entry.gsx$vtcoursenumber.$t))
                vtCourses = [{
                    subject: 'VT',
                    number: 'XXXX',
                    credits: -1
                }];

            const nvccCourses = parseCourses(
                entry.gsx$vccscoursenumber.$t,
                entry.gsx$vccscredits.$t
            );

            const equiv = new CourseEquivalency(nvccCourses, vtCourses, determineEquivType(vtCourses));

            equivalencies.push(equiv);
        }

        return [equivalencies, 0];
    }
}

function parseCourses(courseStr, creditsStr): Course[] {
    // courseStr formats:
    // "MTH 173"
    // "ART 103 + 104"
    // "EGR 110 + EGR 120"
    // "BLD 101, 102 & 111"
    // "BLD 101, 102 & DRF 165"
    // "BLD 231, 232, 242 & 247"
    // "CST 151 OR 152"
    // "PED 111 or 112"
    // "FOR 105 + FOR 115 + FOR 125"
    // "FOR 202 + HLT 106 + FOR 290/297"

    // Remove all non course subjects/course numbers
    // http://regexr.com/3euqd
    const normalizationRegex = /(, | ?[&+] ?| or |\/)/ig;

    // Replace all non course numbers/subjects with whitespace, normalize, and split
    const parts = normalizeWhitespace(courseStr).replace(normalizationRegex, ' ').split(' ');

    // Search for parts that were stuck together (like 'CHEM1025') and split
    // them into two capture groups.
    // http://regexr.com/3euqg
    const unbindingRegex = /^([A-Z]{2,4})([0-9]{2,4})$/;
    for (let i = 0; i < parts.length; i++) {
        const match = parts[i].match(unbindingRegex);
        if (match) {
            parts[i++] = match[1];
            parts.splice(i, 0, match[2]);
        }
    }

    const creditsArray = interpretCreditInput(creditsStr);

    // Add all identified courses here. Assume there will be at least one course
    const courses: Course[] = [];

    // Append additional courses to the array
    let subject = parts[0];
    for (let i = 1; i < parts.length; i++) {
        if (/[0-9X]{2,4}/i.test(parts[i])) {
            // First letter is numeric, assume course number
            const credits = courses.length >= creditsArray.length ? -1 : creditsArray[courses.length];
            courses.push({
                subject,
                number: parts[i],
                credits
            });
        } else if (/[a-z]/i.test(parts[i][0])) {
            // First letter is alphabetic, assume subject
            subject = parts[i];
        } else {
            throw new Error('Invalid course segment: i=' + i + ', parts[i]=' + parts[i]);
        }
    }

    return courses;
}
