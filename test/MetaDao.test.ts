import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Database, Mode } from '../src/Database';
import MetaDao, { META_COLL } from '../src/queries/MetaDao';
import { dropIfExists } from '../src/util';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('MetaDao', () => {
    before('connect to database', () => Database.get().connect(Mode.TEST));
    beforeEach('drop collection', () => dropIfExists(META_COLL));

    describe('updateDatasetVersion()', () => {
        it('should be able to update and insert the dataset version', async () => {
            const dao = new MetaDao(0);
            // We should only be modifying 1 document
            expect((await dao.updateDatasetVersion()).upsertedCount).to.equal(1);

            // Ensure that we can retrieve this value later
            expect(await dao.getMeta()).to.deep.equal({
                _id: MetaDao.META_DOC_ID,
                datasetVersion: dao.datasetVersion
            });
        });
    });

    describe('get and put()', () => {
        it('should be disabled', () => {
            // put() is disabled in favor of updateDatasetVersion()
            expect(new MetaDao().put({ datasetVersion: 0 })).to.eventually.be.rejectedWith(Error);

            expect(new MetaDao().get('some ID')).to.eventually.be.rejectedWith(Error);
        });
    });

    describe('shouldIndex()', () => {
        beforeEach('drop collection', () => dropIfExists(META_COLL));

        it('should return true when there is no meta document', async () => {
            const dao = new MetaDao();

            // Meta collection is dropped before every test, so there is no
            // metadata document available
            expect(await dao.shouldIndex()).to.be.true;
        });

        it('should return false when the existing dataset version is the same', async () => {
            const version = 0;
            const dao = new MetaDao(version);

            await dao.updateDatasetVersion();
            expect(await dao.shouldIndex()).to.be.false;
        });

        it('should return true when the existing dataset version is different', async () => {
            const initialVer = 0, finalVer = 1;
            let dao = new MetaDao(initialVer);

            await dao.updateDatasetVersion();

            dao = new MetaDao(finalVer);
            expect(await dao.shouldIndex()).to.be.true;
        });
    });

    after('disconnect from database', () => Database.get().disconnect());
});