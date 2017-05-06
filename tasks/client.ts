import * as del from 'del';
import * as webpack from 'webpack';

import {
    distDir, sass, typescript, watch
} from './util';

const publicDir = (rel: string = '') => distDir('public/' + rel);
const PROJECT = 'client/config/tsconfig.json';
const webpackConfig = require('../client/webpack.config');

export default function(gulp) {
    gulp.task('build:client', [
        'compile:client',
        'sass:global'
    ]);

    gulp.task('compile:client', (callback) => {
        const conf = Object.create(webpackConfig);
        webpack(conf, (err) => {
            if (err) throw err;
            callback();
        });
    });

    gulp.task('compile:client:test', () =>
        typescript({
            project: PROJECT,
            src: 'client/test/**/*.ts',
            dest: publicDir('test')
        })
    );

    gulp.task('sass:global', () =>
        sass({
            src: 'client/assets/**/*.scss',
            dest: publicDir('assets')
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
            'client/assets/**/*.scss':  'sass:global',
            'client/test/**/*.spec.ts': 'compile:client:test'
        });
    });
}
