import * as del from 'del';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as coveralls from 'gulp-coveralls';
import * as cssMin from 'gulp-css';
import * as nodemon from 'gulp-nodemon';
import * as pug from 'gulp-pug';
import tslint from 'gulp-tslint';
import * as tsc from 'gulp-typescript';
import * as runSequence from 'run-sequence';

gulp.task('default', ['build'], (cb) => {
    runSequence('start', cb);
});

////// BUILDING //////
gulp.task('build:server', () => {
    const proj = tsc.createProject('server/tsconfig.json');
    const result = gulp.src('server/src/**/*.ts')
        .pipe(proj());

    return result.js.pipe(gulp.dest('dist/server'));
});

gulp.task('build:client', ['css', 'jspm', 'jspm:config'], () => {
    return gulp.src('client/app/**/*.ts')
        .pipe(gulp.dest('dist/server/public/app'));
});

gulp.task('jspm', () => {
    return gulp.src(['client/jspm_packages/**/*'])
        .pipe(gulp.dest('dist/server/public/jspm_packages'));
});

gulp.task('jspm:config', () => {
    return gulp.src('client/jspm.config.js')
        .pipe(gulp.dest('dist/server/public'));
});

gulp.task('views', () => {
    return gulp.src('views/*.pug')
        .pipe(pug({
            data: {
                year: new Date().getFullYear()
            }
        }))
        .pipe(gulp.dest('dist/server/views'));
});

gulp.task('css', () => {
    return gulp.src('client/style/**/*.css')
        .pipe(cssMin())
        .pipe(gulp.dest('dist/server/public/style'));
});

gulp.task('watch', () => {
    const conf = {
        'server/src/**/*.ts': ['build:server'],
        'views/**/*.pug': ['views'],
        'client/app/jspm.config.js': ['jspm:config'],
        'client/app/**/*.ts': ['build:client']
    };
    for (const src of Object.keys(conf)) {
        gulp.watch(src, conf[src]);
    }
});

gulp.task('build', (cb) => {
    runSequence('clean', 'build:server', 'build:client', 'views', 'watch', cb);
});

gulp.task('start', () => {
    // Read from standard config so devs can also run `nodemon` from the console
    // and have it work the same way as it does here
    const config = JSON.parse(fs.readFileSync('nodemon.json', 'utf8'));
    nodemon(config);
});

////// TESTING AND LINTING //////
gulp.task('clean', ['clean:testPrep'], () => {
    return del(['dist']);
});

gulp.task('clean:testPrep', () => {
    return del(['server/src/indexers/.cache', 'server/src/views']);
});

gulp.task('views:testPrep', ['views'], () => {
    return gulp.src('dist/views/**/*.html')
        .pipe(gulp.dest('server/src/views'));
});

gulp.task('testPrep', ['clean:testPrep', 'views:testPrep']);

gulp.task('coveralls', () => {
    gulp.src('coverage/lcov.info').pipe(coveralls());
});

gulp.task('lint', () => {
    gulp.src('src/**/*.ts')
        .pipe(tslint({
            configuration: 'tslint.json',
            formatter: 'prose'
        }))
        .pipe(tslint.report());
});

