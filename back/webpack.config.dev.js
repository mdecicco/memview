const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.base');

module.exports = (env, options) => {
    const webpackConfig = baseConfig(env, options);
    return merge(webpackConfig, {
        output: {
            path: __dirname + '/',
            publicPath: 'http://localhost:4000/',
            filename: 'app.out.js'
        },
        optimization: {
            nodeEnv: 'web'
        },
        target: 'web',
        devServer: {
            publicPath: '/',
            inline: true,
            port: 4000
        }
    });
};
