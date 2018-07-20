const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = [{
  entry: {
    'oauth-legacy': ['babel-polyfill', './web/oauth.js'],
    'home-legacy': ['babel-polyfill', './web/home.js'],
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
                // modules: false,
                // useBuiltIns: true,
                targets: {
                  browsers: [
                    '> 1% in US',
                  ],
                },
              }],
            ],
            plugins: [ 'syntax-dynamic-import' ]
          },
        },
      },
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
    'oauth': './web/oauth.js',
    'home': './web/home.js',
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist'
  },
  devtool: 'source-map',
  mode: 'development',
  module: {
    rules: [{
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
          plugins: [ 'syntax-dynamic-import' ]
        },
      },
    }],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    symlinks: false
  },
},
{
  entry: {
    'cordova': ['babel-polyfill', './web/cordova.js']
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
            plugins: [ 'syntax-dynamic-import' ]
          },
        },
      },
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
    ])
  ]
}];