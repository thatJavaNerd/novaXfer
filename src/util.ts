import * as fs from 'fs';
import * as path from 'path';

import { Database, Database as db, Mode } from './Database';
import * as requestLib from 'request'
import {Course, CreditRange, EquivType, Institution} from "./models";

const nbsp = String.fromCharCode(160);

    /**
     * Replaces all sequences of new line, nbsp, and space characters with a
     * single space and trims.
     */
export function normalizeWhitespace(text: string): string {
    return text.replace(new RegExp(`(?:\r\n|\r|\n|${nbsp}| )+`, 'g'), ' ').trim();
}

/** 'Denodeify' fs.access with Promises */
export function ensureFileExists(file: string): Promise<any> {
    return new Promise(function(fulfill, reject) {
        fs.access(file, function(fserr) {
            if (fserr) reject(fserr);
            else fulfill(file);
        });
    });
}

/**
 * Specialized request() wrapper for indexers. Utilizes caching when
 * specified by shouldSkipCache().
 */
export function request(requestData: any, institution: Institution, useCache = true): Promise<Buffer> {
    if (institution === undefined)
        return Promise.reject('expecting an institution');

    if (!useCache || shouldSkipCache()) {
        // Go directly for the fresh data
        return networkRequest(requestData);
    } else {
        // Use fresh data if no cache is available
        return loadCache(institution).catch(function() {
            return networkRequest(requestData).then(function(contents) {
                return saveCache(contents, institution);
            });
        });
    }
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

export async function dropIfExists(name: string) {
    // Find collections with the specified name
    const colls = await Database.get().mongo().listCollections({name: name}).toArray();
    // Drop if Mongo reports that a collection with that name exists,
    // otherwise return true
    return colls.length > 0 ? Database.get().mongo().dropCollection(colls[0].name) : true;
}

/** Uses the request module to send an HTTP request */
function networkRequest(requestData: any): Promise<Buffer> {
    return new Promise(function(fulfill, reject) {
        const chunks: Buffer[] = [];
        let error: Error | null = null;

        requestLib(requestData)
        .on('response', function(response) {
            if (response.statusCode !== 200)
                error = new Error(`Bad status code: ${response.statusCode}`);
        }).on('error', function(err) {
            if (err) error = err;
        }).on('data', function(chunk: Buffer) {
            chunks.push(chunk);
        }).on('end', function() {
            if (error) return reject(error);
            else return fulfill(Buffer.concat(chunks));
        });
    });
}

/** Returns true if connected to the test database OR if not connected at all */
function shouldSkipCache(): boolean {
    return db.get()._mode() !== Mode.TEST && db.get()._mode() !== null;
}

/** Saves the given data to the file specified by `cacheFileForIndexer(institution)` */
function saveCache(contents: Buffer, institution: Institution): Promise<string> {
    const cache = cacheFileForIndexer(institution);
    return mkdir(path.dirname(cache)).then(function() {
        return new Promise(function(fulfill, reject) {
            fs.writeFile(cacheFileForIndexer(institution), contents, function(err) {
                if (err) reject(err);
                else fulfill(contents);
            });
        });
    });
}

/** Reads the file specified by `cacheFileForIndexer(institution)` */
function loadCache(institution: Institution): Promise<Buffer> {
    return new Promise(function(fulfill, reject) {
        fs.readFile(cacheFileForIndexer(institution), (err, data) => {
            if (err) reject(err);
            else fulfill(data);
        });
    });
}

/**
 * Makes a directory if one does not already exist. Rejects if the given file
 * descriptor exists but is not a file.
 */
function mkdir(dir: string): Promise<string> {
    // Test if the directory exists
    return ensureFileExists(dir)
    .catch(function(err) {
        return new Promise(function(fulfill, reject) {
            if (err && err.code === 'ENOENT') {
                // Catch an error if when accessing a directory that doesn't exist
                fs.mkdir(dir, function(err) {
                    // Then make said directory
                    if (err) return reject(err);
                    else return fulfill(dir);
                });
            } else {
                // Some other unexpected error
                return Promise.reject(err);
            }
        });
    }).then(function() {
        // lstat(2) our fd
        return lstat(dir);
    }).then(function(stats) {
        // Make sure the directory is actually a directory
        return new Promise(function(fulfill, reject) {
            if (!stats.isDirectory()) reject('Exists, but not a directory: ' + dir);
            else fulfill(dir);
        });
    });
}

/** Wraps a Promise around async lstat(2) */
function lstat(fd): Promise<fs.Stats> {
    return new Promise(function(fulfill, reject) {
        fs.lstat(fd, function(err, stats) {
            if (err) reject(err);
            else fulfill(stats);
        });
    });
}

function cacheFileForIndexer(institution: Institution): string {
    return `${path.resolve(__dirname)}/../../../.cache/${institution.acronym.toLowerCase()}`;
}
