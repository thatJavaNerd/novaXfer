const gulp = require('gulp');
const ts = require('gulp-typescript');
const coveralls = require('gulp-coveralls');
const tslint = require('gulp-tslint');
const del = require('del');

const tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', () => {
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
            formatter: 'verbose',
            configuration: 'tslint.json'
        }))
        .pipe(tslint.report())
});

gulp.task('clean:testPrep', () => {
    return del(['src/indexers/.cache']);
});

gulp.task('default', ['watch', 'assets']);
