
import * as logger from 'morgan';
import * as express from 'express';
import * as bodyParser from 'body-parser';

export default function createServer(): express.Application {
    const app = express();
    installMiddleware(app);
    addRoutes(app);

    return app;
}

const installMiddleware = (app: express.Application): void => {
    app.use(logger('dev'));
    app.use(bodyParser.json());
};

const addRoutes = (app: express.Application): void => {
    app.get('/', (req, res) => {
        res.json({hello: 'world'});
    });
};