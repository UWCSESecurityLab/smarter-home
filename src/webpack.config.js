const path = require('path');
const glob = require('glob');
const webpack = require('webpack');

module.exports = [{
  entry: {
    'oauth-prod': './web/entrypoints/oauth.js',
    'home-prod': './web/entrypoints/home.js',
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
              '@babel/preset-react',
              [ '@babel/preset-env', {
                corejs: 3,
                targets: { "esmodules": true},
                useBuiltIns: 'usage',
              }],
            ],
            plugins: [
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-proposal-object-rest-spread'
            ]
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
                sassOptions: {
                  includePaths: glob.sync('node_modules').map((d) => path.join(__dirname, d))
                }
              }
            }
        ]
      }
    ],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production'
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    symlinks: false
  },
},

{
  entry: {
    'oauth-dev': './web/entrypoints/oauth.js',
    'home-dev': './web/entrypoints/home.js',
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
              '@babel/preset-react',
              [ '@babel/preset-env', {
                corejs: 3,
                targets: {
                  "esmodules": true
                },
                useBuiltIns: 'usage',
              }],
            ],
            plugins: [
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-proposal-object-rest-spread'
            ]
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
                sassOptions: {
                  includePaths: glob.sync('node_modules').map((d) => path.join(__dirname, d))
                }
              }
            }
        ]
      }
    ],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development'
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    symlinks: false
  },
}];