#!/usr/bin/env node
'use strict';

import * as fs from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import * as colors from 'colors/safe';

import * as listEndpoints from 'express-list-endpoints';
import createApp from './server';

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

    let app = await createApp();
    logEndpoints(app);

    await app.listen(options.port);

    console.log('\nMagic is happening on port ' + colors.bold(options.port.toString()));
}

function printHelp() {
    let script = path.basename(__filename);
    console.log(colors.bold(`novaXfer v${packageJson.version}`));
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
