import * as del from 'del';
import * as favicon from 'gulp-favicons';
import * as webpack from 'webpack';

import {
    distDir, sass, version, watch
} from './util';

const publicDir = (rel: string = '') => distDir('public/' + rel);
const webpackConfig = require('../client/webpack.config');

export default function(gulp) {
    gulp.task('client:build', [
        'client:bundle',
        'client:favicons',
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

    gulp.task('client:favicons', () =>
        gulp.src('art/favicon.svg')
            .pipe(favicon({
                appName: 'novaXfer',
                appDescription: 'Lightning fast NVCC course equivalencies',
                developerName: 'Matthew Dean',
                developerURL: 'https://github.com/thatJavaNerd',
                path: './',
                url: 'https://www.novaxfer.io',
                start_url: '/',
                display: 'standalone',
                version: version(),
                logging: false,
                online: true,
                preferOnline: true
            }))
            .on('error', console.error)
            .pipe(gulp.dest(publicDir('meta')))
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
