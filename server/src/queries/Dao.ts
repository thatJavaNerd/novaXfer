import { Collection, Db } from 'mongodb';
import { Database } from '../Database';
import { QueryError, QueryErrorType } from './errors';

/**
 * @template {I} ID type (ObjectID, string, etc.)
 * @template {G} Data type pulled out of the database (get())
 * @template {P} Data type put into the database (put())
 */
abstract class Dao<I, G, P> {
    /** Reference to a mongodb.Db */
    protected db: Db;

    constructor(public readonly collectionName: string) {
        this.db = Database.get().mongo();
    }

    public get(id: I | string): Promise<G> {
        let actualId = id;
        if (typeof actualId === 'string') {
            actualId = this.resolveId(id as string);
        }
        return this._get(actualId);
    }

    public async put(data: P[] | P): Promise<I[]> {
        // Ensure data is an array
        const x = Array.isArray(data) ? data : [data];
        const ids = await this._put(x);

        // ids is a "fake" array (no length property), convert it to a real array
        const realArray: I[] = [];
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
    protected async _get(id: I): Promise<G> {
        const doc = await this.coll().findOne({_id: id});
        if (doc === null)
            throw new QueryError(QueryErrorType.MISSING, `Could not find document with ID "${id}"`);
        return doc;
    }

    protected abstract _put(data: P[]): Promise<I[]>;

    protected abstract resolveId(id: string): I;

    /**
     * Returns the collection that this DAO is working on. Equivalent to
     * `this.db.collection(this.collectionName)`.
     */
    protected coll(): Collection {
        return this.db.collection(this.collectionName);
    }
}

export default Dao;
