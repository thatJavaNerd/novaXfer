import  * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {Database as Db, Mode} from '../src/Database';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Database', () => {
    const db = Db.get();

    beforeEach('disconnect if necessary', () => {
        return db.disconnect();
    });
    
    it('should be able to connect', async function() {
        const mode = Mode.TEST;

        await db.connect(mode);
        expect(db.mongo()).to.not.be.null;
        expect(db.url()).to.equal('mongodb://localhost:27017/highlights_test');
        expect(db.isConnected()).to.be.true;
        expect(db.mode()).to.be.equal(mode);
    });

    it('should allow us to connect() multiple times with the same mode', async () => {
        const mode = Mode.TEST;
        await db.connect(mode);
        expect(db.mode()).to.equal(mode);
        // Shouldn't throw an error
        await db.connect(mode);
    });

    it('should throw an error when attempting to connect in a different mode', async () => {
        await db.connect(Mode.TEST);
        expect(db.connect(Mode.PROD)).to.eventually.be.rejected;
    });

    it('should disconnect properly', async function() {
        function expectDisconnected() {
            // We have to use underscore-prefixed functions for nullable return
            // types.
            expect(db._mongo()).to.be.null;
            expect(db._url()).to.be.null;
            expect(db._mode()).to.be.null;
            expect(db.isConnected()).to.be.false;
        }

        expectDisconnected();
        await db.connect(Mode.TEST);
        await db.disconnect();
        expectDisconnected();
    });
});
