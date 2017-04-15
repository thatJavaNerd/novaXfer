import { CourseEquivalency, EquivalencyContext, Institution } from '../models';
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
