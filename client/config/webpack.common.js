const path = require('path');
const webpack = require('webpack');

module.exports = {
    context: path.join(__dirname, '..'),
    entry: {
        app: './app/novaXfer.ts',
        vendor: './app/vendor.ts',
        polyfills: './app/polyfills.ts'
    },
    output: {
        filename: 'dist/public/[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loaders: [
                    {
                        loader: 'awesome-typescript-loader',
                        options: {
                            configFileName: 'client/config/tsconfig.json'
                        }
                    },
                    'angular2-template-loader'
                ]
            },
            {
                test: /\.pug$/,
                loader: ['raw-loader', 'pug-html-loader']
            },
            {
                test: /\.scss$/,
                exclude: '/node_modules/',
                loaders:  ['raw-loader', 'sass-loader']
            }
        ]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            names: ['app', 'vendor', 'polyfills'],
        })
    ]
};
