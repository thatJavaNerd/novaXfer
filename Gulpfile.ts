import * as del from 'del';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as coveralls from 'gulp-coveralls';
import * as nodemon from 'gulp-nodemon';
import * as pug from 'gulp-pug';
import tslint from 'gulp-tslint';
import * as tsc from 'gulp-typescript';

gulp.task('default', ['build:server', 'watch', 'start']);

////// BUILDING //////
gulp.task('build:server', () => {
    const proj = tsc.createProject('server/tsconfig.json');
    const result = gulp.src('server/src/**/*.ts')
        .pipe(proj());

    return result.js.pipe(gulp.dest('dist/server'));
});

gulp.task('views', () => {
    return gulp.src('views/*.pug')
        .pipe(pug({
            data: {
                year: new Date().getFullYear()
            }
        }))
        .pipe(gulp.dest('dist/public/views'));
});

gulp.task('watch', () => {
    gulp.watch('server/src/**/*.ts', ['build:server']);
});

gulp.task('start', () => {
    // Read from standard config so devs can also run `nodemon` from the console
    // and have it work the same way as it does here
    const config = JSON.parse(fs.readFileSync('nodemon.json', 'utf8'));
    nodemon(config);
});

////// TESTING AND LINTING //////
gulp.task('clean:testPrep', () => {
    return del(['src/indexers/.cache']);
});

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

