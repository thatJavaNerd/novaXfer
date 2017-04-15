import { expect } from 'chai';

import { Database, Mode } from '../src/Database';
import InstitutionDao from '../src/queries/InstitutionDao';
import { findIndexers } from '../src/indexers/index';
import * as _ from 'lodash';
import { dropIfExists } from '../src/util';
import { validateInstitution } from './validation';
import { Institution } from '../src/models';

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

        after('drop collection', () => dropIfExists(dao.collectionName))
    });

    describe('inserting and writing', () => {
        beforeEach('drop collection', () => dropIfExists(dao.collectionName));

        describe('get() and put()', () => {
            it('should pull out the same data that was put in', async () => {
                const institution: Institution = {
                    acronym: 'XYZ',
                    fullName: 'Some College',
                    location: 'Earth'
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
