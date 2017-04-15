import {
    Course,
    CourseEquivalency, CreditRange, EquivalencyContext, EquivType,
    Institution
} from '../models';
import request from './request';
import * as pdf2table from 'pdf2table';
import * as cheerio from 'cheerio';
import * as _ from 'lodash';

export abstract class Indexer<T> {
    async findAll(): Promise<EquivalencyContext> {
        const equivalencies = this.parseEquivalencies(
            await this.parseBody(
                await request(this.prepareRequest(), this.institution)));

        return {
            institution: this.institution,
            equivalencies: equivalencies
        };
    }

    /** The Institution from which this indexer is finding equivalencies for */
    abstract institution: Institution;

    /**
     * Creates an object to send to request(). The return value of this
     * function should not change in between calls. That is, this function
     * should always return the same primitive or object literal. See
     * the 'request' library documentation for valid input.
     */
    protected abstract prepareRequest(): any;

    /**
     * Parses the response body into something usable by parseEquivalencies()
     *
     * @data A buffer of the data from the network request sent with the
     *       configuration created by prepareRequest()
     */
    protected abstract parseBody(data: Buffer): Promise<T>

    /** Parses the body of the network request into an EquivalencyContext */
    protected abstract parseEquivalencies(body: T): CourseEquivalency[]
}

/**
 * An Indexer that parses the response body as UTF-8-encoded HTML.
 */
export abstract class HtmlIndexer extends Indexer<CheerioStatic> {
    protected async parseBody(data: Buffer): Promise<CheerioStatic> {
        return cheerio.load(data.toString('utf8'));
    }
}

/**
 * An Indexer that parses the response body as a PDF in the form of a 2D string
 * array representing that PDF in tabular form.
 */
export abstract class PdfIndexer extends Indexer<string[][]> {
    protected parseBody(data: Buffer): Promise<string[][]> {
        return new Promise(function(fulfill, reject) {
            pdf2table.parse(data, function(err, rows) {
                if (err) reject(err);
                else fulfill(rows);
            });
        });
    }
}

// We need to import these class after we declare Indexer and its subclasses to
// avoid a circular dependency error
import CnuIndexer from './cnu';
import GmuIndexer from "./gmu";
import GtIndexer from "./gt";
import UvaIndexer from "./uva";
import VtIndexer from "./vt";
import WmIndexer from "./wm";
import VcuIndexer from "./vcu";

/**
 * A report that includes all equivalency contexts and some basic stats about
 * those contexts
 */
export interface IndexReport {
    equivalencyContexts: EquivalencyContext[];
    institutionsIndexed: number;
    coursesIndexed: number;
}

/**
 * Finds the names of all the built in university indexers (JS files in
 * <root>/app/indexers/).
 */
export function findIndexers(): Indexer<any>[] {
    return [
        new CnuIndexer(),
        new GmuIndexer(),
        new GtIndexer(),
        new UvaIndexer(),
        new VcuIndexer(),
        new VtIndexer(),
        new WmIndexer()
    ]
}

/**
 * Finds all courses from all known Indexers.
 */
export async function index(): Promise<IndexReport> {
    // Find all of the Indexers and wait for them all to find their equivalencies
    const contexts = await Promise.all(_.map(findIndexers(), i => i.findAll()));

    let totalCourses = 0;
    for (let context of contexts) {
        totalCourses += context.equivalencies.length;
    }

    return {
        equivalencyContexts: contexts,
        institutionsIndexed: contexts.length,
        coursesIndexed: totalCourses
    };
}

const nbsp = String.fromCharCode(160);

/**
 * Replaces all sequences of new line, nbsp, and space characters with a
 * single space and trims.
 */
export function normalizeWhitespace(text: string): string {
    return text.replace(new RegExp(`(?:\r\n|\r|\n|${nbsp}| )+`, 'g'), ' ').trim();
}

/**
 * Attempts to parse one or more lists of credits.
 *
 * "3,3" => [3, 3]
 * "3-4" => [{min: 3, max:4}]
 * "3,1-5,4" => [3, {min: 1, max: 5}, 4]
 * "" => []
 */
export function interpretCreditInput(str: string): Array<number | CreditRange> {
    // Unknown amount of credits
    if (str === '')
        return [];

    const parts = str.replace(' ', '').split(',');
    const credits: Array<number | CreditRange> = [];

    for (let i = 0; i < parts.length; i++) {
        // A hyphen indicates that the credit is a range (ex: "3-4")
        const segment = parts[i];
        if (segment.indexOf('-') != -1) {
            const creditSegments = segment.split('-');
            const a = parseInt(creditSegments[0]);
            const b = parseInt(creditSegments[1]);

            // For some odd reason?
            if (a == b) {
                credits.push(a);
            } else {
                credits.push({
                    min: Math.min(a, b),
                    max: Math.max(a, b)
                });
            }

        } else {
            credits.push(parseInt(segment, 10));
        }
    }

    return credits;
}

/** Returns true if at least one of the courses ends with numberEnding */
export function determineEquivType(courses: Course[], numberEnding = 'XX'): EquivType {
    if (!courses)
        throw new Error('No courses passed');

    let containsGeneric = false;
    for (let course of courses) {
        if (course.number.endsWith(numberEnding)) {
            containsGeneric = true;
            break;
        }
    }

    return containsGeneric ? EquivType.GENERIC: EquivType.DIRECT;
}

