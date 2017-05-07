import * as del from 'del';
import * as about from 'gulp-about';
import * as merge from 'merge2';

import { distDir, renderMarkdown, renderPug, typescript, watch } from './util';

export default function(gulp) {
    gulp.task('server:build', [
        'server:compile',
        'server:views',
        'server:views',
        'server:about'
    ]);

    gulp.task('server:compile', () =>
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

    gulp.task('server:views', ['server:views:templates', 'server:views:docs']);

    gulp.task('server:views:templates', () =>
        renderPug({
            src: 'views/**/*.pug',
            dest: distDir('views')
        })
    );

    gulp.task('server:views:docs', () =>
        renderMarkdown({
            src: 'docs/**/*.md',
            dest: distDir('views/docs')
        })
    );

    gulp.task('server:testPrep', ['server:testPrep:views', 'server:testPrep:docs']);

    gulp.task('server:testPrep:views', () =>
        renderPug({
            src: 'views/**/*.pug',
            dest: 'server/src/views'
        })
    );

    gulp.task('server:testPrep:docs', () =>
        renderMarkdown(({
            src: 'docs/**/*.md',
            dest: 'server/src/views/docs'
        }))
    );

    gulp.task('server:clean', () =>
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

    gulp.task('server:watch', () => {
        watch({
            'server/src/**/*.ts': 'compile:server',
            'views/**/*.pug': 'views:server'
        });
    });
}
