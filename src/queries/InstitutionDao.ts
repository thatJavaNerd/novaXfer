
import Dao from './Dao';
import { Institution } from '../models';
import { ObjectID } from 'bson';
import { Database } from '../Database';
import { QueryError, QueryErrorType } from './errors';

export default class InstitutionDao extends Dao<Institution, Institution> {
    public static readonly COLLECTION = 'institutions';

    constructor() {
        super(InstitutionDao.COLLECTION);
    }

    protected async _put(data: Institution[]): Promise<ObjectID[]> {
        await Database.get().dropIfExists(this.coll().collectionName);
        return (await this.coll().insertMany(data)).insertedIds;
    }

    async getByAcronym(acronym: string): Promise<Institution> {
        const inst = await this.coll().findOne({ acronym: acronym });
        if (inst === null)
            throw new QueryError(QueryErrorType.MISSING);

        return inst;
    }

    async getAll(): Promise<Institution[]> {
        return this.coll()
            .find()
            .sort({ acronym: 1 })
            .toArray();
    }
}
