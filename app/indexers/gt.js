const request = require('request');
const assert = require('assert');
const cheerio = require('cheerio');
const models = require('../models.js');
const regexUtil = require('../util/regex.js');

const dataUrl = 'https://oscar.gatech.edu/pls/bprod/wwsktrna.P_find_subj_levl_classes';
const institution = 'Georgia Tech';

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
}

// Totally didn't copy+paste this nice one liner off StackOverflow
var formQuery = Object.keys(basicFormData).reduce(function(a,k){a.push(k+'='+encodeURIComponent(basicFormData[k]));return a},[]).join('&');

// Append our subjects to the query
for (var i = 0; i < subjects.length; i++) {
    formQuery += '&sel_subj=' +  subjects[i];
}

const requestData = {
    url: dataUrl,
    method: 'POST',
    // GT loves complex data
    form: formQuery
}

const headerRows = 2;
const vccsNumberIndex = 2;
const gtNumberIndex = 9;
const gtCreditIndex = 11;
const extraneousRowIndicatorIndex = 7;
const extraneousRowIndicatorText = "And";

const nbspRegex = new RegExp(regexUtil.nbspChar + regexUtil.nbspChar);

function findAll(each, done) {
    request(requestData, function(err, response, body) {
        if (err != null)
            return done(err);
        var $ = cheerio.load(body);

        // Access the main table
        var cssQuery = 'table.datadisplaytable tr';
        var tableRows = $(cssQuery).slice(headerRows);
        tableRows.each(function(index, element) {
            let row = $(tableRows[index]);
            if (isExtraneousRow(row)) {
                // Skip this row, it's been handled by the row previous
                return true;
            }

            var vccsNumber = getCourseNumber(row, vccsNumberIndex);
            if (vccsNumber.split(" ")[1].length < 3) {
                // Some courses listed are malformed. Check to make sure the
                // VCCS course number (just the number, not the subject) is an
                // appropriate length;
                return true;
            }

            var gtNumber = getCourseNumber(row, gtNumberIndex);
            var gtCredits = parseInt(columnAtIndex(row, gtCreditIndex).text().trim());

            // Check for the possibility of additional row
            if (index < tableRows.length - 1) {
                var nextRow = $(tableRows[index + 1]);
                if (isExtraneousRow(nextRow)) {
                    gtNumber += ', ' + getCourseNumber(nextRow, gtNumberIndex);
                    gtCredits += parseInt(columnAtIndex(nextRow, gtCreditIndex).text().trim());
                }
            }

            each(new models.CourseEquivalency(
                new models.Course(vccsNumber, -1),
                new models.Course(gtNumber, gtCredits),
                institution
            ));
        });

        // Since $.each is synchronous we can call done() when outside that block
        return done();
    });

}

function columnAtIndex(tr, index) {
    return tr.children(`:nth-child(${index})`);
}

function getCourseNumber(tr, colIndex) {
    // The textual representation of course names are
    // {SUBJECT}&nbsp;&nbsp;{NUMBER}, so we replace the two special
    // spaces with one normal one.
    return columnAtIndex(tr, colIndex).text().replace(nbspRegex, " ");
}

function isExtraneousRow(tr) {
    return columnAtIndex(tr, extraneousRowIndicatorIndex).text() == extraneousRowIndicatorText;
}

module.exports.findAll = findAll
module.exports.institution = institution
