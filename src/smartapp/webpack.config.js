module.exports = [{
  entry: {
    'dist/oauth-legacy': ['babel-polyfill', './web/oauth.js'],
    'dist/home-legacy': ['babel-polyfill', './web/home.js'],
    'cordova/www/js/home-legacy': ['babel-polyfill', './web/home.js']
  },
  output: {
    filename: '[name].js',
    path: __dirname
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
                    '> 1%',
                    'last 2 versions',
                    'Firefox ESR',
                  ],
                },
              }],
            ],
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
    'dist/oauth': './web/oauth.js',
    'dist/home': './web/home.js',
    'cordova/www/js/home': './web/home.js'
  },
  output: {
    filename: '[name].js',
    path: __dirname
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
                  'Chrome >= 60',
                  'Safari >= 10.1',
                  'iOS >= 10.3',
                  'Firefox >= 54',
                  'Edge >= 15',
                ],
              },
            }],
          ],
        },
      },
    }],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    symlinks: false
  },
}];