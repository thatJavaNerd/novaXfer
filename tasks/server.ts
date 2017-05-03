import * as del from 'del';
import * as about from 'gulp-about';
import * as merge from 'merge2';

import { distDir, renderMarkdown, renderPug, typescript, watch } from './util';

export default function(gulp) {
    gulp.task('build:server', [
        'compile:server',
        'views:server',
        'views:docs',
        'server:about'
    ]);

    gulp.task('compile:server', () =>
        merge(
            typescript({
                project: 'server/tsconfig.json',
                src: 'server/src/**/*.ts',
                dest: distDir()
            }),
            gulp.src('package.json')
                .pipe(about())
                .pipe(gulp.dest(distDir()))
        )
    );

    gulp.task('views:server', () =>
        renderPug({
            src: 'views/**/*.pug',
            dest: distDir('views')
        })
    );

    gulp.task('views:docs', () =>
        renderMarkdown({
            src: 'docs/**/*.md',
            dest: distDir('views/docs')
        })
    );

    gulp.task('testPrep:server', ['testPrep:server:docs'], () =>
        renderPug({
            src: 'views/**/*.pug',
            dest: 'server/src/views'
        })
    );

    gulp.task('testPrep:server:docs', () =>
        renderMarkdown(({
            src: 'docs/**/*.md',
            dest: 'server/src/views/docs'
        }))
    );

    gulp.task('clean:server', () =>
        del([
            'server/src/common',
            'server/src/indexers/.cache',
            'server/src/views'
        ])
    );

    gulp.task('server:about', () =>
        gulp.src('package.json')
            .pipe(about())
            .pipe(gulp.dest('server/src'))
    );

    gulp.task('watch:server', () => {
        watch({
            'server/src/**/*.ts': 'compile:server',
            'views/**/*.pug': 'views:server'
        });
    });
}
