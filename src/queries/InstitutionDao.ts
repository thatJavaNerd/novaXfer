
import Dao from './Dao';
import { Institution } from '../models';
import { ObjectID } from 'bson';
import { Database } from '../Database';

export default class InstitutionDao extends Dao<Institution, Institution> {
    constructor() {
        super('institutions');
    }

    protected async _put(data: Institution[]): Promise<ObjectID[]> {
        await Database.get().dropIfExists(this.coll().collectionName);
        return (await this.coll().insertMany(data)).insertedIds;
    }

    async getAll(): Promise<Institution[]> {
        return this.coll()
            .find()
            .sort({ acronym: 1 })
            .toArray();
    }
}
