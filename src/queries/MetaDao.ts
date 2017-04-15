
import Dao from './Dao';
import { UpdateWriteOpResult } from 'mongodb';
import { ObjectID } from 'bson';

interface MetadataDoc {
    datasetVersion: number
}

const DATASET_VERSION = 0;
export const META_COLL = '__meta__';

export default class MetaDao extends Dao<MetadataDoc, MetadataDoc> {
    public static readonly META_DOC_ID = 'metadata';

    constructor(public datasetVersion: number = DATASET_VERSION) {
        super(META_COLL);
    }

    protected _put(data: MetadataDoc[]): Promise<ObjectID[]> {
        throw new Error('use updateDatasetVersion() instead');
    }

    updateDatasetVersion(): Promise<UpdateWriteOpResult> {
        return this.coll().updateOne(
            { _id: MetaDao.META_DOC_ID },
            { $set: { datasetVersion: this.datasetVersion } },
            { upsert: true }
        );
    }

    async get(id: ObjectID | string): Promise<MetadataDoc> {
        throw new Error('use getMeta() instead');
    }

    async getMeta(): Promise<MetadataDoc> {
        return this.coll().findOne({_id: MetaDao.META_DOC_ID});
    }

    async shouldIndex(): Promise<boolean> {
        const meta = await this.coll().findOne({ _id: MetaDao.META_DOC_ID });
        if (meta === null) return true;
        if (meta.datasetVersion === undefined) return true;
        return meta.datasetVersion !== this.datasetVersion;
    }
}