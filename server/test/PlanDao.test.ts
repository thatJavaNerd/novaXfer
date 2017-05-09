import { ObjectID } from 'bson';
import { AssertionError, expect } from 'chai';

import { TransferPlan } from '../src/common/api-models';
import { Database, Mode } from '../src/Database';
import { PlanDao } from '../src/queries/PlanDao';
import { expectQueryError } from './util';

describe('PlanDao', () => {
    let dao: PlanDao;

    before('connect to database', () => {
        return Database.get().connect(Mode.TEST).then(() => {
            dao = new PlanDao();
        });
    });

    beforeEach('drop collection', () => Database.get().dropIfExists(dao.collectionName));

    describe('get() and put()', () => {
        it('should retrieve the same data that was put in', async () => {
            const ids = await dao.put(mockPlan);
            // We only put 1 document in, we should only get one ID out
            expect(ids).to.have.lengthOf(1);
            const id = ids[0];

            // Using shortid, should be a string
            expect(id).to.be.a('string');
            expect(id).to.not.be.instanceof(ObjectID);

            const fromDb = await dao.get(id);
            expect(fromDb).to.have.keys('_id', 'institutions', 'semesters');
            expect(fromDb.institutions).to.deep.equal(mockPlan.institutions);
            expect(fromDb.semesters).to.deep.equal(mockPlan.semesters);
        });

        it('should throw a QueryError when get()-ing a non-existent plan', () =>
            expectQueryError(() => dao.get('foobarbaz'))
        );
    });

    describe('update()', () => {
        it('should create a new TransferPlan if none exist', async () => {
            const newPlan: TransferPlan = await dao.update(mockPlan);
            expect(newPlan).to.have.keys('_id', 'institutions', 'semesters');
            expect(newPlan.institutions).to.deep.equal(mockPlan.institutions);
            expect(newPlan.semesters).to.deep.equal(mockPlan.semesters);
        });

        it('should replace an existing TransferPlan if it already existed', async () => {
            const id = (await dao.put(mockPlan))[0];

            const oldPlan: TransferPlan = await dao.get(id);
            oldPlan.institutions = ['FOO', 'BAR'];
            const newPlan: TransferPlan = await dao.update(oldPlan);

            expect(newPlan._id).to.equal(oldPlan._id);
            expect(newPlan.institutions).to.deep.equal(oldPlan.institutions);
        });
    });

    after('clean collection and disconnect', async () => {
        await Database.get().dropIfExists(dao.collectionName);
        return Database.get().disconnect();
    });
});

const mockPlan: TransferPlan = {
    institutions: ['UVA', 'VCU'],
    semesters: [
        {
            name: 'Fall 2016',
            courses: [
                {
                    subject: 'CSC',
                    number: '202'
                },
                {
                    subject: 'ACC',
                    number: '211'
                }
            ]
        },
        {
            name: 'Spring 2016',
            courses: [
                {
                    subject: 'ENG',
                    number: '111'
                },
                {
                    subject: 'CSC',
                    number: '205'
                }
            ]
        }
    ]
};
