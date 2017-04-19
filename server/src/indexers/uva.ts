import {
    Course, CourseEquivalency, EquivType
} from '../models';
import { determineEquivType, HtmlIndexer, normalizeWhitespace } from './index';

const headerRows = 2;
const nvccIndex = 1; // CSS queries are 1-indexed
const uvaIndex = 2;

// Used when the college doens't accept equivalencies for a NVCC course
const COURSE_NO_EQUIV = Object.freeze({
    subject: 'NONE',
    number: '000',
    credits: 0
});

export default class UvaIndexer extends HtmlIndexer {
    public institution = {
        acronym: 'UVA',
        fullName: 'University of Virginia',
        location: 'Virginia',
        parseSuccessThreshold: 1.00
    };

    protected prepareRequest(): any {
        return 'http://ascs8.eservices.virginia.edu/AsEquivs/Home/EquivsShow?schoolId=1001975';
    }

    protected parseEquivalencies(body: CheerioStatic): [CourseEquivalency[], number] {
        const $ = body;
        const equivalencies: CourseEquivalency[] = [];

        const rows = $($('table')[3]).find('tr').slice(headerRows);
        rows.each(function(index) {
            switch (getRowType($(this))) {
                case 'unknown':
                    throw new Error('Found row with type \'unknown\'');
                case 'empty': // This is a row to separate courses, skip
                case 'input':
                case 'output':
                    // We handle supplement and freebie rows when their base courses
                    // are found
                    return true;
            }

            const nvccCourses = [parseCourse($(this), nvccIndex)];
            const uvaCourses = [parseCourse($(this), uvaIndex)];

            const eq = new CourseEquivalency(nvccCourses, uvaCourses, EquivType.DIRECT);

            if (index + 1 < rows.length) {
                // Possibility of extraneous row
                const nextRowType = getRowType($(rows[index + 1]));
                if (nextRowType === 'unknown') {
                    throw new Error('Found row with type \'unknown\'');
                }
                if (nextRowType === 'input' || nextRowType === 'output') {
                    // Add a supplement
                    const columnIndex = nvccIndex; // Assume input course
                    if (nextRowType === 'output')
                        index = uvaIndex;
                    eq[nextRowType].push(parseCourse($(rows[index + 1]), columnIndex));
                }
            }

            eq.type = findEquivType(eq.output);

            equivalencies.push(eq);
        });

        return [equivalencies, 0];
    }
}

function parseCourse($tr, index): Course {
    const baseStr = normalizeWhitespace($tr.children(`td:nth-child(${index})`)
        .text());
    if (baseStr === '(no credit)') {
        // UVA doesn't offer credit for this course, make up our own
        // course number
        return COURSE_NO_EQUIV;
    }

    // Business as usual
    const parts = baseStr.split(' ');

    let credits = -1;
    if (parts.length >= 3)
        credits = parseInt(parts[2], 10);

    return {
        subject: parts[0],
        number: parts[1],
        credits
    };
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
    const nvccColumn = $tr.children('td:nth-child(1)').text().trim();
    const uvaColumn = $tr.children('td:nth-child(2)').text().trim();

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

function findEquivType(uvaCourses) {
    if (uvaCourses[0].subject === COURSE_NO_EQUIV.subject &&
        uvaCourses[0].number === COURSE_NO_EQUIV.number) {

        return EquivType.NONE;
    }

    return determineEquivType(uvaCourses, 'T');
}
