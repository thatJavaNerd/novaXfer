import * as shortid from 'shortid';

import { TransferPlan } from '../common/api-models';
import Dao from './Dao';

/**
 * Data Access Object for TransferPlans
 */
export class PlanDao extends Dao<string, TransferPlan, TransferPlan> {
    public static readonly COLLECTION = 'plans';
    public constructor() {
        super(PlanDao.COLLECTION);
    }

    /**
     * Updates a TransferPlan. Do not include the `_id` property on the plan
     * to create a new document.
     *
     * @param plan
     * @returns {Promise<TransferPlan>} The updated TransferPlan
     */
    public async update(plan: TransferPlan): Promise<TransferPlan> {
        if (plan._id === undefined)
            plan._id = shortid.generate();

        return (await this.coll().findOneAndUpdate(
            { _id: plan._id },
            { $set: {
                institutions: plan.institutions,
                semesters: plan.semesters
            } },
            { upsert: true, returnOriginal: false }
        )).value;
    }

    protected async _put(data: TransferPlan[]): Promise<string[]> {
        const ids: string[] = [];
        for (const plan of data) {
            const id = shortid.generate();
            plan._id = id;
            ids.push(id);
        }

        await this.coll().insertMany(data);
        return ids;
    }

    protected resolveId(id: string): string {
        return id;
    }
}
