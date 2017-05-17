import * as fs from 'fs';
import * as gulp from 'gulp';
import * as markdown from 'gulp-markdown';
import * as plumber from 'gulp-plumber';
import * as pug from 'gulp-pug';
import * as sassBuild from 'gulp-sass';
import * as tsc from 'gulp-typescript';
import * as path from 'path';
import * as webpack from 'webpack';

const webpackConfig = require('../client/webpack.config');

/** Generic options for a Gulp task that works with files. */
export interface IOTaskOptions {
    /** Passed to gulp.src() */
    src: string | string[];
    /** Passed to gulp.dest() */
    dest: string;
}

/** Options specific for compiling a TypeScript project */
export interface CompileTypescriptOptions extends IOTaskOptions {
    /** Path to tsconfig.json relative to Gruntfile.ts */
    project: string;
}

/**
 * Each entry in the configuration object maps a file glob to the task(s) to
 * execute when a file matching that glob is modified.
 */
export interface WatchConfig {
    [fileGlob: string]: string[] | string;
}

export interface WebpackCompilerConfig {
    gulpCallback: () => void;
    watch: boolean;
}

export enum NodeEnv {
    PROD,
    DEV
}

/** Compiles a TypeScript project */
export function typescript(opts: CompileTypescriptOptions) {
    const proj = tsc.createProject(opts.project);
    const result = gulp.src(opts.src).pipe(proj());

    return result.js.pipe(gulp.dest(opts.dest));
}

/** Compiles Sass */
export function sass(opts: IOTaskOptions) {
    return gulp.src(opts.src)
        .pipe(sassBuild().on('error', sassBuild.logError))
        .pipe(gulp.dest(opts.dest));
}

/** cp -r for gulp */
export function cp(src: string | string[], dest: string) {
    return gulp.src(src).pipe(gulp.dest(dest));
}

/** Renders pug files */
export function renderPug(opts: IOTaskOptions) {
    gulp.src(opts.src)
        .pipe(plumber())
        .pipe(pug())
        .pipe(gulp.dest(opts.dest));
}

/** Renders markdown */
export function renderMarkdown(opts: IOTaskOptions) {
    gulp.src(opts.src)
        .pipe(markdown())
        .pipe(gulp.dest(opts.dest));
}

/** Uses gulp to watch for file changes */
export function watch(conf: WatchConfig) {
    for (const src of Object.keys(conf)) {
        // Ensure the tasks are an array
        const tasks = Array.isArray(conf[src]) ? conf[src] : [conf[src]];
        gulp.watch(src, tasks);
    }
}

export function webpackCompiler(opts: WebpackCompilerConfig) {
    const conf = Object.create(webpackConfig);
    const compiler = webpack(conf);
    let callbackCalled = false;

    // Show progress like we used "webpack --progress"
    compiler.apply(new webpack.ProgressPlugin({}));
    const callback = (err, stats) => {
        if (err) {
            console.error(err.stack || err);
            if (err.details)
                console.error(err.details);
            return;
        }

        process.stdout.write(stats.toString({ colors: true }) + '\n');

        if (!callbackCalled) {
            opts.gulpCallback();
            callbackCalled = true;
        }
    };

    if (opts.watch) {
        compiler.watch(undefined, callback);
    } else {
        compiler.run(callback);
    }
}

export function env(): NodeEnv {
    switch (process.env.NODE_ENV) {
        case 'prod':
        case 'production':
            return NodeEnv.PROD;
        default:
            return NodeEnv.DEV;
    }
}

export function version(): string {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')).version;
}

/** Gets a path relative to the distribution directory */
export function distDir(rel: string = '') {
    return 'dist/' + rel;
}
