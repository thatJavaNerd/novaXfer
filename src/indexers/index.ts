import {EquivalencyContext, Institution} from "../models";

// We need to delcare and export this class before we try to import subclasses
// to avoid a circular dependency error
export abstract class Indexer {
    abstract institution: Institution;
    abstract findAll(): Promise<EquivalencyContext>;
}


import CnuIndexer from './cnu';
import GmuIndexer from "./gmu";
import GtIndexer from "./gt";
import UvaIndexer from "./uva";
import VtIndexer from "./vt";
import WmIndexer from "./wm";
import VcuIndexer from "./vcu";

export interface IndexReport {
    equivalencyContexts: EquivalencyContext[];
    institutionsIndexed: number;
    coursesIndexed: number;
}

/**
 * Finds the names of all the built in university indexers (JS files in
 * <root>/app/indexers/).
 */
export function findIndexers(): Indexer[] {
    return [
        new CnuIndexer(),
        new GmuIndexer(),
        new GtIndexer(),
        new UvaIndexer(),
        new VcuIndexer(),
        new VtIndexer(),
        new WmIndexer()
    ]
}

export function index(): Promise<IndexReport> {
    const indexers = findIndexers();
    // Find all our university course equivalency indexers
    return Promise.all(indexers.map(ind => ind.findAll())).then(function(contexts): IndexReport {
        let totalCourses = 0;
        for (let context of contexts) {
            totalCourses += context.equivalencies.length;
        }

        return {
            equivalencyContexts: contexts,
            institutionsIndexed: contexts.length,
            coursesIndexed: totalCourses
        };
    });
}
