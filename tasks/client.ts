import * as del from 'del';

import { cp, distDir, renderPug, sass, typescript, watch } from './util';

const publicDir = (rel: string = '') => distDir('public/' + rel);
const PROJECT = 'client/tsconfig.json';

export default function(gulp) {
    gulp.task('build:client', [
        'compile:client',
        'jspm',
        'sass',
        'views:templates'
    ]);

    gulp.task('compile:client', () =>
        typescript({
            project: PROJECT,
            src: 'client/app/**/*.ts',
            dest: publicDir('app')
        })
    );

    gulp.task('compile:client:test', () =>
        typescript({
            project: PROJECT,
            src: 'client/test/**/*.ts',
            dest: publicDir('test')
        })
    );

    gulp.task('jspm', ['jspm:config', 'jspm:packages']);
    gulp.task('jspm:config', () =>
        cp('client/jspm.config.js', publicDir())
    );
    gulp.task('jspm:packages', () =>
        cp('client/jspm_packages/**/*', publicDir('jspm_packages'))
    );

    gulp.task('sass', ['sass:component', 'sass:global']);
    gulp.task('sass:component', () =>
        sass({
            src: 'client/app/**/*.scss',
            dest: publicDir('app')
        })
    );

    gulp.task('sass:global', () =>
        sass({
            src: 'client/assets/**/*.scss',
            dest: publicDir('assets')
        })
    );

    gulp.task('views:templates', () =>
        renderPug({
            src: 'client/app/**/*.pug',
            dest: publicDir('app')
        })
    );

    gulp.task('clean:client', () =>
        del([
            'client/app/common'
        ])
    );

    gulp.task('watch:client', () => {
        watch({
            'client/app/**/*.scss':     'sass:component',
            'client/app/**/*.pug':      'views:templates',
            'client/app/**/*.ts':       'compile:client',
            'client/assets/**/*.scss':  'sass:core',
            'client/test/**/*.spec.ts': 'compile:client:test'
        });
    });
}
