import { expect } from 'chai';

import { Database, Mode } from '../src/Database';
import InstitutionDao from '../src/queries/InstitutionDao';
import { findIndexers } from '../src/indexers/index';
import * as _ from 'lodash';
import { validateInstitution } from './validation';
import { Institution } from '../src/models';
import { QueryError, QueryErrorType } from '../src/queries/errors';

describe('InstitutionDao', () => {
    let dao: InstitutionDao;

    before('connect to database', () => {
        return Database.get().connect(Mode.TEST).then(() => {
            dao = new InstitutionDao();
        });
    });

    describe('queries', () => {
        before('insert institutions', async () => {
            // Insert all institutions into the database
            return dao.put(_.map(findIndexers(), i => i.institution));
        });

        describe('getAll()', () => {
            it('should produce valid Institutions', async () => {
                const data = await dao.getAll();
                // Validate all institutions
                _.each(data, validateInstitution)
            });
        });

        describe('getByAcronym()', () => {
            it('should return only one document', async () => {
                const acronym = findIndexers()[0].institution.acronym;
                const institution = await dao.getByAcronym(acronym);

                expect(institution).to.exist;
                expect(institution!.acronym).to.equal(acronym);
            });

            it('should reject for a non-existent institution', async () => {
                try {
                    await dao.getByAcronym('non-existent');

                    // If we got here something went wrong
                    expect(true, 'should have rejected').to.be.false;
                } catch (ex) {
                    expect(ex).is.an.instanceof(QueryError);
                    expect((ex as QueryError).type).to.equal(QueryErrorType.MISSING);
                }
            });
        });

        after('drop collection', () => Database.get().dropIfExists(dao.collectionName))
    });

    describe('inserting and writing', () => {
        beforeEach('drop collection', () => Database.get().dropIfExists(dao.collectionName));

        describe('get() and put()', () => {
            it('should pull out the same data that was put in', async () => {
                const institution: Institution = {
                    acronym: 'XYZ',
                    fullName: 'Some College',
                    location: 'Earth',
                    parseSuccessThreshold: 0.99
                };

                const id = (await dao.put(institution))[0];
                const out = await dao.get(id);
                expect(out.acronym).to.equal(institution.acronym);
                expect(out.fullName).to.equal(institution.fullName);
                expect(out.location).to.equal(institution.location);
            });
        });
    });

    after('disconnect from database', () => Database.get().disconnect());
});
