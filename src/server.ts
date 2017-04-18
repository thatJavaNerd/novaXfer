import * as logger from 'morgan';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import api from './routes/api';
import { findIndexers, indexAll, IndexReport } from './indexers/index';
import InstitutionDao from './queries/InstitutionDao';
import EquivalencyDao from './queries/EquivalencyDao';
import MetaDao from './queries/MetaDao';
import * as _ from 'lodash';

export function createServer(): express.Application {
    const app = express();
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use('/api', api());

    return app;
}

export async function doFullIndex(): Promise<IndexReport> {
    const instDao = new InstitutionDao(),
        equivDao = new EquivalencyDao(),
        metaDao = new MetaDao();

    const indexReport = await indexAll();
    await Promise.all([
        equivDao.put(indexReport.equivalencyContexts),
        instDao.put(_.map(findIndexers(), i => i.institution)),
        metaDao.updateDatasetVersion()
    ]);

    return indexReport;
}