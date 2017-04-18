import {
    determineEquivType, HtmlIndexer, normalizeWhitespace
} from './index';
import {
    Course, CourseEquivalency, CREDITS_UNKNOWN, EquivType,
} from '../models';

const headerRows = 2;
const nvccNumberIndex = 2;
const gtNumberIndex = 9;
const gtCreditIndex = 11;
const extraneousRowIndicatorIndex = 7;
const extraneousRowIndicatorText = "And";

export default class GtIndexer extends HtmlIndexer {
    protected prepareRequest(): any {
        const dataUrl = 'https://oscar.gatech.edu/pls/bprod/wwsktrna.P_find_subj_levl_classes';

        const subjects = ["ACC", "ARA", "ART", "BIO", "BIOL", "BUS", "CHEM", "CHM",
            "CSC", "CST", "ECO", "EGR", "ENG", "ENGL", "ESL", "GENL", "GOL", "HIS",
            "IST", "ITD", "ITE", "ITN", "JAPN", "JPN", "MATH", "MTH", "MUS", "NAS",
            "PED", "PHI", "PHY", "PHYS", "PLS", "POLS", "PSY", "REA", "SDV", "SOC",
            "SPA", "SPD", "SPO", "STD"];

        const basicFormData = {
            state_in: 'VA',
            levl_in: 'US',
            term_in: 'US',
            sbgi_in: '005515' // Code for NVCC Annandale (what GT uses to symbolize NVCC in general)
        };

        // Totally didn't copy+paste this nice one liner off StackOverflow
        let formQuery = Object.keys(basicFormData).reduce(function (a: any[], k) {
            a.push(k + '=' + encodeURIComponent(basicFormData[k]));
            return a;
        }, []).join('&');

        // Append our subjects to the query
        for (let i = 0; i < subjects.length; i++) {
            formQuery += '&sel_subj=' +  subjects[i];
        }

        return {
            url: dataUrl,
            method: 'POST',
            // GT loves complex data
            form: formQuery
        };
    }

    protected parseEquivalencies(body: CheerioStatic): [CourseEquivalency[], number] {
        const $ = body;
        const equivalencies: CourseEquivalency[] = [];

        // Access the main table
        const cssQuery = 'table.datadisplaytable tr';
        const tableRows = $(cssQuery).slice(headerRows);
        tableRows.each(function(index) {
            const row = $(tableRows[index]);
            if (isExtraneousRow(row)) {
                // Skip this row, it's been handled by the row previous
                return true;
            }

            const nvccNumber = getCourseNumber(row, nvccNumberIndex);
            if (nvccNumber[1].length < 3) {
                // Some courses listed are malformed. Check to make sure the
                // NVCC course number (just the number, not the subject) is an
                // appropriate length. Example: "MATH 6", "EXL 12"
                return true;
            }

            const gtNumber = getCourseNumber(row, gtNumberIndex);
            const gtCredits = parseInt(columnAtIndex(row, gtCreditIndex).text().trim());

            const nvccCourses: Course[] = [{
                subject: nvccNumber[0],
                number: nvccNumber[1],
                credits: CREDITS_UNKNOWN
            }];
            const gtCourses: Course[] = [{
                subject: gtNumber[0],
                number: gtNumber[1],
                credits: gtCredits
            }];

            // Check for the possibility of additional row
            if (index < tableRows.length - 1) {
                const nextRow = $(tableRows[index + 1]);
                if (isExtraneousRow(nextRow)) {
                    const numberParts = getCourseNumber(nextRow, gtNumberIndex);
                    gtCourses.push({
                        subject: numberParts[0],
                        number: numberParts[1],
                        credits: parseInt(columnAtIndex(nextRow, gtCreditIndex).text().trim(), 10)
                    });
                }
            }

            const equiv = new CourseEquivalency(nvccCourses, gtCourses, findEquivType(gtCourses));
            equivalencies.push(equiv);
        });

        return [equivalencies, 0];
    }

    institution = {
        fullName: 'Georgia Tech',
        acronym: 'GT',
        location: 'Georgia',
        parseSuccessThreshold: 1.00
    };
}

function findEquivType(gtCourses): EquivType {
    if (gtCourses[0].subject === 'ET') {
        // ET NOGT means no credit
        if (gtCourses[0].number === 'NOGT')
            return EquivType.NONE;
        // ET DEPT means that the course's department must approve it or some
        // other special handling. ET LAB means that credit is awarded with
        // the lab course
        else if (gtCourses[0].number === 'DEPT' || gtCourses[0].number === 'LAB')
            return EquivType.SPECIAL;
    }

    return determineEquivType(gtCourses);
}

function columnAtIndex(tr, index) {
    return tr.children(`:nth-child(${index})`);
}

function getCourseNumber(tr, colIndex) {
    // The textual representation of course names are
    // {SUBJECT}&nbsp;&nbsp;{NUMBER}, so we replace the two special
    // spaces with one normal one.
    return normalizeWhitespace(columnAtIndex(tr, colIndex).text()).split(' ');
}

function isExtraneousRow(tr) {
    return columnAtIndex(tr, extraneousRowIndicatorIndex).text() == extraneousRowIndicatorText;
}

