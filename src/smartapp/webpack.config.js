const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');

module.exports = [{
  entry: {
    'oauth-legacy': ['babel-polyfill', './web/entrypoints/oauth.js'],
    'home-legacy': ['babel-polyfill', './web/entrypoints/home.js'],
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist'
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
                useBuiltIns: true,
                targets: {
                  "esmodules": true
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
  // Enable importing JS files without specifying their's extenstion -> ADDED IN THIS STEP
  //
  // So we can write:
  // import MyComponent from './my-component';
  //
  // Instead of:
  // import MyComponent from './my-component.jsx';
  resolve: {
    extensions: ['.js', '.jsx'],
    symlinks: false
  },
},
{
  entry: {
    'oauth': './web/entrypoints/oauth.js',
    'home': './web/entrypoints/home.js',
    'beacons': './web/entrypoints/beacons.js'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist'
  },
  devtool: 'source-map',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
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
                    'Chrome >= 61',
                    'Safari >= 11',
                    'iOS >= 11.2',
                    'Firefox >= 60',
                    'Edge >= 16',
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
  resolve: {
    extensions: ['.js', '.jsx'],
    symlinks: false
  },
},
{
  entry: {
    'cordova-bundle': ['babel-polyfill', './web/entrypoints/cordova.js']
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
  // Enable importing JS files without specifying their's extenstion -> ADDED IN THIS STEP
  //
  // So we can write:
  // import MyComponent from './my-component';
  //
  // Instead of:
  // import MyComponent from './my-component.jsx';
  resolve: {
    extensions: ['.js', '.jsx'],
    symlinks: false
  },
  plugins: [
    new CopyWebpackPlugin([
      // { from: 'web/html/cordova.html', to: 'cordova/www/index.html' },
      { from: 'web/css', to: 'cordova/www/css' }
    ]),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ]
}];