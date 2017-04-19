import * as del from 'del';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as coveralls from 'gulp-coveralls';
import * as nodemon from 'gulp-nodemon';
import tslint from 'gulp-tslint';
import * as tsc from 'gulp-typescript';

gulp.task('build:server', () => {
    const proj = tsc.createProject('server/tsconfig.json');
    const result = gulp.src('server/src/**/*.ts')
        .pipe(proj());

    return result.js.pipe(gulp.dest('dist/server'));
});

gulp.task('watch', ['build:server'], () => {
    gulp.watch('server/src/**/*.ts', ['build:server']);
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

gulp.task('start', () => {
    // Read from standard config so devs can also run `nodemon` from the console
    // and have it work the same way as it does here
    const config = JSON.parse(fs.readFileSync('nodemon.json', 'utf8'));
    nodemon(config);
});

gulp.task('clean:testPrep', () => {
    return del(['src/indexers/.cache']);
});

gulp.task('default', ['build:server', 'watch', 'start']);
