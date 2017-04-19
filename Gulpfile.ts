import * as coveralls from 'gulp-coveralls';
import * as del from 'del';
import * as gulp from 'gulp';
import * as tsc from 'gulp-typescript';
import tslint from 'gulp-tslint';

gulp.task('scripts', () => {
    const tsProject = tsc.createProject('tsconfig.json');
    const tsResult = tsProject.src().pipe(tsProject());
    return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['scripts'], () => {
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
