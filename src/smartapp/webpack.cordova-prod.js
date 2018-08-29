const path = require('path');
const glob = require('glob');
const webpack = require('webpack');

module.exports = {
  entry: {
    'cordova': ['babel-polyfill', './web/entrypoints/cordova.js']
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/cordova/www/js/'
  },
  devtool: 'source-map',
  mode: 'development',
  // Loaders configuration -> ADDED IN THIS STEP
  // We are telling webpack to use "babel-loader" for .js and .jsx files
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              'react',
              ['env', {
                modules: false,
                useBuiltIns: true,
                targets: {
                  browsers: [
                    'ChromeAndroid >= 33',
                    'iOS >= 8',
                  ],
                },
              }],
            ],
            plugins: [ 'syntax-dynamic-import', "transform-object-rest-spread" ]
          },
        },
      }, {
        test: /\.scss$/,
        use: [
            "style-loader",  // creates style nodes from JS strings
            "css-loader",    // translates CSS into CommonJS
            {
              loader: "sass-loader",  // compiles Sass to CSS
              options: {
                includePaths: glob.sync('node_modules').map((d) => path.join(__dirname, d))
              }
            }
        ]
      }
    ],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production'
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    symlinks: false
  },
};