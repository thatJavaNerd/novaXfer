#!/usr/bin/env node
'use strict';

import * as fs from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import * as colors from 'colors/safe';

import * as listEndpoints from 'express-list-endpoints';
import { createServer, doFullIndex } from './server';
import { Database, Mode } from './Database';
import MetaDao from './queries/MetaDao';

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));

// Catch unhandled Promises
process.on('unhandledRejection', function(reason, p) {
    console.error("Unhandled Promise rejection: ");
    throw reason;
});

interface BootstrapOptions {
    port: number,
    forceIndex: boolean
}

if (hasArgument('--help')) {
    printHelp();
    process.exit(0);
}

// Gather some information from command line arguments and environmental
// variables to start the server
bootstrap({
    port: process.env.PORT || 3000,
    forceIndex: hasArgument('--force-index')
});

async function bootstrap(options: BootstrapOptions) {
    console.log(colors.bold('Starting novaXfer v' + packageJson.version));

    try {
        await Database.get().connect(Mode.PROD);
    } catch (ex) {
        console.error('Could not connect to database: ' + ex.message);
    }

    if (options.forceIndex || await (new MetaDao().shouldIndex())) {
        try {
            console.log('Indexing all institutions...');
            const report = await doFullIndex();
            const rate = (report.weightedSuccessRate * 100).toFixed(4);
            console.log(`Indexed ${report.coursesIndexed} equivalencies from ` +
                `${report.institutionsIndexed} institutions (${rate}% success rate)`);

        } catch (ex) {
            console.error('Could not complete full index');
            throw ex;
        }
    }

    try {
        let app = await createServer();
        logEndpoints(app);
        await app.listen(options.port);
        console.log('\nMagic is happening on port ' + colors.bold(options.port.toString()));
    } catch(ex) {
        // Don't try to handle the error, let it be printed to stderr. We do
        // want to make sure we're disconnected from the database though.
        await Database.get().disconnect();

        throw ex;
    }

}

function printHelp() {
    let script = path.basename(__filename);
    console.log(colors.bold(`${packageJson.name} v${packageJson.version}`));
    console.log('\nUsage:');
    console.log(`$ ${script} [--force-index] [--help]`);
    console.log('  --force-index: Forces fresh data to be imported from the Indexers');
    console.log('  --help: Prints this help message');
    console.log(`\nFor more see ${colors.bold(packageJson.repository)}`);
}

/**
 * Logs a list of available endpoints to stdout
 *
 * @param  {object} app Express app
 */
function logEndpoints(app) {
    console.log('Available endpoints:\n');
    let endpoints = _.sortBy(listEndpoints(app), (e: any) => e.path);
    for (let e of endpoints) {
        console.log(`  ${_.join(e.methods, ', ')} ${e.path}`);
    }
}

/**
 * Returns true if any argument to this function is included in process.argv
 * @return Boolean [description]
 */
function hasArgument(names: string[] | string): boolean {
    const arr = Array.isArray(names) ? names : [names];

    for (let name of arr) {
        if (process.argv.indexOf(name) >= 0)
            return true;
    }

    return false;
}
