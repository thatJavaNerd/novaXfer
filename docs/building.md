# Building

novaXfer is built with Gulp 3. The default task will build the app, watch sources, and start the server.

```sh
$ gulp
```

Common tasks:

 - `build` builds the entire app
 - `client:build` only builds the client
 - `server:build` only builds the server
 - `watch` executes the relevant tasks when a file changes
 - `start` starts the server with nodemon

Do a production build by setting the `NODE_ENV` environmental variable

```sh
$ NODE_ENV=production gulp
```

Compiled files will be built to `dist/`. If you don't need to rebuild the app, just run

```sh
$ node dist
```

Specify a port to serve on with the `PORT` environmental variable

```sh
$ PORT=8081 node dist
```

## Testing

For simplicity, you can run both server-side and client-side tests with the test script defined in [package.json](https://github.com/thatJavaNerd/novaXfer/blob/master/package.json):

```sh
$ yarn test
```
