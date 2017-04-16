
import { expect } from 'chai'
import { Database, Mode } from '../src/Database';
import { createServer, doFullIndex } from '../src/server';
import { Application } from 'express';
import * as _ from 'lodash';
import { findIndexers } from '../src/indexers/index';
import * as request from 'supertest';

describe('API v1', () => {
    let app: Application;
    const apiRequest = (relPath: string, expectedStatus: number, query?: object, validate?: (dataOrError: any) => void) => {
        return request(app)
            .get('/api/v1' + relPath + createQuery(query))
            .expect('Content-Type', /json/)
            .expect(expectedStatus)
            .then(res => {
                verifyResponse(res.body, expectedStatus);

                if (validate !== undefined)
                    validate(expectedStatus >= 200 && expectedStatus < 300 ? res.body.data : res.body.error);
            });
    };

    before('connect to and reset database', async function() {
        // Let it process
        this.timeout(30000);
        await Database.get().connect(Mode.TEST);
        await doFullIndex();
        app = createServer();
    });

    describe('GET /api/v1/*', () => {
        it('should 404 with JSON data', () => {
            return apiRequest('/foobar', 404, undefined, (error) => {
                expect(error.message).to.exist;
                expect(error.input).to.deep.equal({});
            });
        });
    });

    describe('GET /api/v1/institution', () => {
        it('should return all institutions', async () => {
            return apiRequest('/institution', 200, undefined, (data: any) => {
                expect(data).to.have.lengthOf(findIndexers().length);
            });
        });
    });

    describe('GET /api/v1/institution/:id', () => {
        it('should return only a single institution', async () => {
            const institution = findIndexers()[0].institution;
            return apiRequest(`/institution/${institution.acronym}`, 200, undefined, (data: any) => {
                expect(data.acronym).to.equal(institution.acronym);
                expect(data.fullName).to.equal(institution.fullName);
                expect(data.location).to.equal(institution.location);
            });
        });

        it('should error when given an invalid acronym', async () => {
            const badNames = [
                '123', // alphabetic only
                'foobar', // max of 3 letters
                'B_AZ', // alphabetic only
                'A' // at least 2 characters
            ];

            for (let name of badNames) {
                await apiRequest('/institution/' + name, 400, undefined, (error: any) => {
                    expect(error.input).to.deep.equal({ acronym: name });
                });
            }
        });

        it('should return an error when given a valid, but non-existent institution', async () => {
            return apiRequest('/institution/ABC', 404, undefined, (error: any) => {
                expect(error.input).to.deep.equal({ acronym: 'ABC' });
            });
        });

        it('should allow case-insensitive input', () => {
            const inst = findIndexers()[0].institution.acronym.toLowerCase();
            return apiRequest('/institution/' + inst, 200, undefined);
        });
    });

    after('disconnect from database', () => Database.get().disconnect());
});

let createQuery = (params: object | undefined) => {
    if (params === undefined) return '';

    let usableProps = _.filter(Object.keys(params), key => params[key] !== undefined);
    if (usableProps.length === 0) return '';

    let query = '?';
    for (let i = 0; i < usableProps.length; i++) {
        if (i !== 0) query += '&';
        query += usableProps[i] + '=' + params[usableProps[i]];
    }

    return query;
};

const verifyResponse = function(response: any, expectedStatus: number) {
    expect(response, 'response was null or undefined').to.exist;
    expect(response.status).to.equal(expectedStatus, 'unexpected status property value');

    if (expectedStatus >= 200 && expectedStatus < 300) {
        // Success
        expect(response.data, 'data did not exist on successful response').to.exist;
        expect(response.error, 'error existed on successful response').to.not.exist;
    } else {
        // Fail
        expect(response.data, 'data existed on unsuccessful response').to.not.exist;
        expect(response.error, 'erorr did not exist on unsuccessful response').to.exist;
    }
};