import { ObjectID } from 'bson';
import { Collection, Db } from 'mongodb';
import { Database } from '../Database';

abstract class Dao<G, P> {
    /** Reference to a mongodb.Db */
    protected db: Db;

    constructor(public readonly collectionName: string) {
        this.db = Database.get().mongo();
    }

    public get(id: ObjectID | string): Promise<G> {
        return this._get(Dao.resolveId(id));
    }

    public async put(data: P[] | P): Promise<ObjectID[]> {
        // Ensure data is an array
        const x = Array.isArray(data) ? data : [data];
        const ids = await this._put(x);

        // ids is a "fake" array (no length property), convert it to a real array
        const realArray: ObjectID[] = [];
        for (const i in ids) {
            if (ids.hasOwnProperty(i)) realArray[i] = ids[i];
        }

        return realArray;
    }

    /**
     * Does the actual fetching of data from Mongo
     * @param id
     * @private
     */
    protected _get(id: ObjectID): Promise<G> {
        return this.coll().findOne({_id: id});
    }

    protected abstract _put(data: P[]): Promise<ObjectID[]>;

    /**
     * Returns the collection that this DAO is working on. Equivalent to
     * `this.db.collection(this.collection)`.
     */
    protected coll(): Collection {
        return this.db.collection(this.collectionName);
    }

    /** Ensures that the input is an ObjectID */
    private static resolveId(id: ObjectID|string): ObjectID {
        return id instanceof ObjectID ? id : new ObjectID(id);
    }
}

export default Dao;
