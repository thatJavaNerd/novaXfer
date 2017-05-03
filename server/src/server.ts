import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as _ from 'lodash';
import * as logger from 'morgan';
import * as path from 'path';

import { findIndexers, indexAll, IndexReport } from './indexers/index';
import EquivalencyDao from './queries/EquivalencyDao';
import InstitutionDao from './queries/InstitutionDao';
import MetaDao from './queries/MetaDao';
import api from './routes/api';
import html from './routes/front';

export function createServer(): express.Application {
    const app = express();
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(helmet());

    app.use('/api', api());
    // Mount static assets before the html module so we can still use our assets
    // without the module's wildcard route catching it first
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/', html());

    return app;
}

export async function doFullIndex(): Promise<IndexReport> {
    const instDao = new InstitutionDao(),
        equivDao = new EquivalencyDao(),
        metaDao = new MetaDao();

    const indexReport = await indexAll();
    await Promise.all([
        equivDao.put(indexReport.equivalencyContexts),
        instDao.put(_.map(findIndexers(), (i) => i.institution)),
        metaDao.updateDatasetVersion()
    ]);

    return indexReport;
}
