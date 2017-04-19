import * as coveralls from 'gulp-coveralls';
import * as del from 'del';
import * as gulp from 'gulp';
import * as tsc from 'gulp-typescript';
import tslint from 'gulp-tslint';

gulp.task('build:server', () => {
    const proj = tsc.createProject('server/tsconfig.json');
    const result = gulp.src('server/src/**/*.ts')
        .pipe(proj());

    return result.js.pipe(gulp.dest('dist/server'));
});

gulp.task('watch', ['build:server'], () => {
    gulp.watch('src/**/*.ts', ['scripts']);
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

gulp.task('clean:testPrep', () => {
    return del(['src/indexers/.cache']);
});

gulp.task('default', ['scripts', 'watch']);
