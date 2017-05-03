import * as gulp from 'gulp';
import * as plumber from 'gulp-plumber';
import * as pug from 'gulp-pug';
import * as sassBuild from 'gulp-sass';
import * as tsc from 'gulp-typescript';

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

/** Uses gulp to watch for file changes */
export function watch(conf: WatchConfig) {
    for (const src of Object.keys(conf)) {
        // Ensure the tasks are an array
        const tasks = Array.isArray(conf[src]) ? conf[src] : [conf[src]];
        gulp.watch(src, tasks);
    }
}

/** Gets a path relative to the distribution directory */
export function distDir(rel: string = '') {
    return 'dist/' + rel;
}
