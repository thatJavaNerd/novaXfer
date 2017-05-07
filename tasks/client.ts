import * as del from 'del';
import * as webpack from 'webpack';

import {
    distDir, sass, typescript, watch
} from './util';

const publicDir = (rel: string = '') => distDir('public/' + rel);
const webpackConfig = require('../client/webpack.config');

export default function(gulp) {
    gulp.task('client:build', [
        'client:bundle',
        'client:styles'
    ]);

    gulp.task('client:bundle', (callback) => {
        const conf = Object.create(webpackConfig);
        webpack(conf, (err) => {
            if (err) throw err;
            callback();
        });
    });

    gulp.task('client:styles', () =>
        sass({
            src: 'client/assets/**/*.scss',
            dest: publicDir('assets')
        })
    );

    gulp.task('client:clean', () =>
        del([
            'client/app/common'
        ])
    );

    gulp.task('client:watch', () => {
        watch({
            'client/app/**/*': 'client:bundle',
            'client/assets/**/*.scss': 'client:styles'
        });
    });
}
