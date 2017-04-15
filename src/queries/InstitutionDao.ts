
import Dao from './Dao';
import { Institution } from '../models';
import { dropIfExists } from '../util';
import { ObjectID } from 'bson';

export default class InstitutionDao extends Dao<Institution, Institution> {
    constructor() {
        super('institutions');
    }

    protected async _put(data: Institution[]): Promise<ObjectID[]> {
        await dropIfExists(this.coll().collectionName);
        return (await this.coll().insertMany(data)).insertedIds;
    }

    async getAll(): Promise<Institution[]> {
        return this.coll()
            .find()
            .sort({ acronym: 1 })
            .toArray();
    }
}
