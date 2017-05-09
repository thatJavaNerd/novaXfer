import { ObjectID } from 'bson';

import { Institution } from '../common/api-models';
import { Database } from '../Database';
import Dao from './Dao';
import { QueryError, QueryErrorType } from './errors';

export default class InstitutionDao extends Dao<ObjectID, Institution, Institution> {
    public static readonly COLLECTION = 'institutions';

    constructor() {
        super(InstitutionDao.COLLECTION);
    }

    public async getByAcronym(acronym: string): Promise<Institution> {
        const inst = await this.coll().findOne({ acronym });
        if (inst === null)
            throw new QueryError(QueryErrorType.MISSING);

        return inst;
    }

    public async getAll(): Promise<Institution[]> {
        return this.coll()
            .find()
            .sort({ acronym: 1 })
            .toArray();
    }

    protected resolveId(id: string): ObjectID {
        return new ObjectID(id);
    }

    protected async _put(data: Institution[]): Promise<ObjectID[]> {
        await Database.get().dropIfExists(this.coll().collectionName);
        return (await this.coll().insertMany(data)).insertedIds;
    }
}
