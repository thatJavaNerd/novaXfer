import * as del from 'del';

import { distDir, renderPug, typescript, watch } from './util';

export default function(gulp) {
    gulp.task('build:server', [
        'compile:server',
        'views:server'
    ]);

    gulp.task('compile:server', () =>
        typescript({
            project: 'server/tsconfig.json',
            src: 'server/src/**/*.ts',
            dest: distDir()
        })
    );

    gulp.task('views:server', () =>
        renderPug({
            src: 'views/**/*.pug',
            dest: 'dist/server/views'
        })
    );

    gulp.task('testPrep:server', () =>
        renderPug({
            src: 'views/**/*.pug',
            dest: 'server/src/views'
        })
    );

    gulp.task('clean:server', () =>
        del([
            'server/src/common',
            'server/src/indexers/.cache',
            'server/src/views'
        ])
    );

    gulp.task('watch:server', () => {
        watch({
            'server/src/**/*.ts': 'compile:server',
            'views/**/*.pug': 'views:server'
        });
    });
}
