import * as del from 'del';
import * as fs from 'fs';
import * as merge from 'merge2';

import * as gulp from 'gulp';
import * as coveralls from 'gulp-coveralls';
import * as nodemon from 'gulp-nodemon';
import * as pug from 'gulp-pug';
import * as sass from 'gulp-sass';
import tslint from 'gulp-tslint';
import * as tsc from 'gulp-typescript';
import * as runSequence from 'run-sequence';

const publicDir = (rel: string = '') => 'dist/server/public/' + rel;
const cp = (src: string | string[], dest: string) =>
    gulp.src(src).pipe(gulp.dest(dest));
const renderPug = (src: string, dest: string) =>
    gulp.src(src)
        .pipe(pug())
        .pipe(gulp.dest(dest));

gulp.task('default', ['build'], (cb) => {
    runSequence('watch', 'start', cb);
});

////// BUILDING //////
gulp.task('build:server', () => {
    const proj = tsc.createProject('server/tsconfig.json');
    const result = gulp.src('server/src/**/*.ts')
        .pipe(proj());

    return result.js.pipe(gulp.dest('dist/server'));
});

gulp.task('build:common', () => {
    const SOURCE = 'common/**/*.ts';
    return merge(
        cp(SOURCE, 'server/src/common'),
        cp(SOURCE, 'client/app/common')
    );
});

gulp.task('views', ['views:templates', 'views:host']);
gulp.task('views:host', () =>
    renderPug('views/**/*.pug', 'dist/server/views')
);
gulp.task('views:templates', () =>
    renderPug('client/app/**/*.pug', publicDir('app'))
);

gulp.task('watch', () => {
    const conf = {
        'client/app/**/*.scss': ['sass:component'],
        'client/app/**/*.pug': ['views:templates'],
        'client/app/**/*.ts': ['clientts'],
        'client/assets/**/*.scss': ['sass:core'],
        'common/**/*.ts': ['build:common'],
        'server/src/**/*.ts': ['build:server'],
        'views/**/*.pug': ['views:host']
    };
    for (const src of Object.keys(conf)) {
        gulp.watch(src, conf[src]);
    }
});

gulp.task('build:client', ['clientts', 'sass', 'views', 'jspm']);

gulp.task('clientts', () => {
    const proj = tsc.createProject('client/tsconfig.json');
    const result = gulp.src('client/app/**/*.ts')
        .pipe(proj());

    return result.js.pipe(gulp.dest(publicDir('app')));
});

gulp.task('jspm', ['jspm:config', 'jspm:packages']);
gulp.task('jspm:config', () =>
    cp('client/jspm.config.js', publicDir())
);
gulp.task('jspm:packages', () =>
    cp('client/jspm_packages/**/*', publicDir('jspm_packages'))
);

gulp.task('sass', ['sass:component', 'sass:core']);
gulp.task('sass:component', () => {
    return gulp.src('client/app/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(publicDir('app')));
});

gulp.task('sass:core', () => {
    return gulp.src('client/assets/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(publicDir('assets')));
});

gulp.task('build', (cb) => {
    runSequence('clean', 'build:server', 'build:client', 'build:common', cb);
});

gulp.task('start', () => {
    // Read from standard config so devs can also run `nodemon` from the console
    // and have it work the same way as it does here
    const config = JSON.parse(fs.readFileSync('nodemon.json', 'utf8'));
    nodemon(config);
});

gulp.task('testPrep', (cb) => {
    runSequence('clean', 'views:testPrep', 'build:common', cb);
});
gulp.task('views:testPrep', () =>
    renderPug('views/**/*.pug', 'server/src/views')
);

////// TESTING AND LINTING //////
gulp.task('clean', () => {
    return del([
        'client/app/common',
        'dist',
        'server/src/common',
        'server/src/indexers/.cache',
        'server/src/views'
    ]);
});

gulp.task('coveralls', () => {
    return gulp.src('coverage/lcov.info').pipe(coveralls());
});

gulp.task('lint', () => {
    return gulp.src(['server/**/*.ts', 'client/app/**/*.ts'])
        .pipe(tslint({
            configuration: 'tslint.json',
            formatter: 'prose'
        }))
        .pipe(tslint.report());
});

