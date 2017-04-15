import {Indexer} from "./index";
import * as util from '../util';
import {
    Course, CourseEquivalency, CREDITS_UNKNOWN, EquivalencyContext,
    Institution
} from '../models';

const cheerio = require('cheerio');

const dataUrl = 'http://admissions.gmu.edu/transfer/transfercreditsearch.asp?state=VA&school=USVCCS&course=View+All';
const institution: Institution = {
    acronym: 'GMU',
    fullName: 'George Mason University',
    location: 'Virginia'
};
const headerRows = 8;

const nvccNumberIndex = 0;
const nvccCreditsIndex = 2;
const gmuNumberIndex = 3;
const gmuCreditsIndex = 5;

export default class GmuIndexer extends Indexer {
    findAll(): Promise<EquivalencyContext> {
        return util.request(dataUrl, institution).then(parseEquivalencies);
    }

    institution = institution;
}

function parseEquivalencies(body): EquivalencyContext {
    const $ = cheerio.load(body);
    const equivalencies: CourseEquivalency[] = [];

    const $rows = $('#contentPrimary tr').slice(headerRows);
    $rows.each(function() {
        const vals = $(this).children('td').map(function () {
            return $(this).text();
        });

        const nvccCourses = parseCourses(vals, nvccNumberIndex, nvccCreditsIndex);
        const gmuCourses = parseCourses(vals, gmuNumberIndex, gmuCreditsIndex);

        equivalencies.push(new CourseEquivalency(
            nvccCourses, gmuCourses, util.determineEquivType(gmuCourses, '---')));
    });

    return {
        institution: institution,
        equivalencies: equivalencies
    };
}

function parseCourses(vals, numberIndex, creditsIndex): Course[] {
    // Courses will either be listed as a single course equivalency or an
    // equivalency with an additional input/output. The extra class is separated
    // by an ampersand.
    const rawCourses = vals[numberIndex].split(' & ');

    const courses = [parseCourse(rawCourses[0], vals[creditsIndex])];
    if (rawCourses.length > 1)
        courses.push(parseCourse(rawCourses[1]));

    return courses;
}

function parseCourse(courseStr: string, creditsStr?: string): Course {
    // Course will sometimes look something like this: "ACCT-----", where
    // the subject is "ACCT" and the number is "----", replace first hyphen
    // with a space and then split.
    const parts = courseStr.replace('-', ' ').split(' ');
    // PHT 102 is listed as 'PHT`-102', remove the tick
    if (parts[0].indexOf('`') === parts[0].length - 1) {
        parts[0] = parts[0].slice(0, parts[0].length - 1);
    }
    const credits = creditsStr === undefined ? CREDITS_UNKNOWN : parseInt(creditsStr);
    return {
        subject: parts[0],
        number: parts[1],
        credits: credits
    };
}

