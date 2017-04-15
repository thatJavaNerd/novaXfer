import * as requestLib from 'request';
import * as fs from 'fs-extra-promise';
import { Institution } from '../models';
import { Database, Mode } from '../Database';
import * as path from 'path';

export default async function(requestData: any, institution: Institution, useCache = true): Promise<Buffer> {
    if (institution === undefined)
        throw new Error('expecting an institution');

    if (!useCache || shouldSkipCache()) {
        // Go directly for the fresh data
        return networkRequest(requestData);
    } else {
        let response: Buffer;
        try {
            response = await fs.readFileAsync(cacheFileForInstitution(institution));
        } catch (ex) {
            response = await networkRequest(requestData);
            await saveCache(response, institution);
        }

        return response;
    }
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

/** Saves the given data to the file specified by `cacheFileForInstitution(institution)` */
async function saveCache(contents: Buffer, institution: Institution): Promise<string> {
    const f = cacheFileForInstitution(institution);

    // Make the parent directory if necessary
    await fs.ensureDirAsync(path.dirname(f));
    // Save the contents to disk
    await fs.writeFile(f, contents);

    return f;
}

/** Returns true if connected to the test database OR if not connected at all */
function shouldSkipCache(): boolean {
    return Database.get()._mode() !== Mode.TEST && Database.get()._mode() !== null;
}

function cacheFileForInstitution(institution: Institution): string {
    return `${path.resolve(__dirname)}/.cache/${institution.acronym.toLowerCase()}`;
}
