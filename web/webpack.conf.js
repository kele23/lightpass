const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

const src = path.resolve(__dirname, './src');
const dist = path.resolve(__dirname, './dist');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',

    entry: path.resolve(src, 'index.js'),
    output: {
        path: dist,
        filename: 'bundle.js',
        clean: true,
    },

    devServer: {
        static: dist,
        webSocketServer: 'sockjs',
        host: '0.0.0.0',
        allowedHosts: 'all',
        port: 3000,
    },

    plugins: [
        ////////////// PAGES
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(src, 'pages', 'index.html'),
        }),

        /////////////////// OTHERS
        new CompressionPlugin(),
        new MiniCssExtractPlugin({
            filename: 'style.css',
            experimentalUseImportModule: false,
        }),
    ],

    module: {
        rules: [
            {
                test: /\.webp/,
                type: 'asset/resource',
            },
            {
                test: /\.hbs$/,
                use: [
                    {
                        loader: 'handlebars-loader',
                        options: {
                            helperDirs: [path.resolve(src, 'helpers')],
                        },
                    },
                ],
            },
            {
                test: /\.js$/,
                exclude: [/node_modules[\\/]core-js/, /node_modules[\\/]webpack[\\/]buildin/],
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [['@babel/preset-env']],
                        },
                    },
                ],
            },

            {
                test: /\.(css)$/,
                exclude: /node_modules/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    { loader: 'css-loader', options: { sourceMap: true, importLoaders: 1 } },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                config: path.resolve(__dirname, 'postcss.config.js'),
                            },
                        },
                    },
                ],
            },
        ],
    },
};
