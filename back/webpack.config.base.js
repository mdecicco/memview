'use strict';
const path = require('path');
const html = require('html-webpack-plugin');

module.exports = (env, options) => {
    return {
        mode: 'development',
        entry: './front/app.js',
        output: {
            filename: 'app.out.js',
            path: path.resolve(__dirname, '../')
        },
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: [
                        'style-loader',
                        'css-loader',
                        'sass-loader'
                    ]
                }, {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: ['babel-loader']
                }
            ]
        },
        resolve: {
            extensions: ['.js', '.scss'],
        },
        plugins: [
            new html({ template: './back/app.html' })
        ],
        target: 'electron-main',
        node: {
            __dirname: false
        }
    };
};
