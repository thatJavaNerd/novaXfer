#!/usr/bin/env node
'use strict';

// Catch unhandled Promises
process.on('unhandledRejection', function(reason, p) {
    console.error("Unhandled Promise rejection: ");
    throw reason;
});

// Define a port to host the server on
const port = process.env.PORT || 8080;

// Whether or not to skip indexing institutions
var skipIndex = false;
process.argv.slice(2).forEach(function(val, index, array) {
    if (val === '--no-index') {
        skipIndex = true;
    }
});

require('./app/server/src/server.js')(port, skipIndex);
