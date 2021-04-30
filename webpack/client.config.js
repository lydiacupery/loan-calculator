const config = require('config');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
// const CircularDependencyPlugin = require('circular-dependency-plugin');

const loaders = require('./loaders');

const DEV_PORT = config.get('devServer.port');

const PROXY_HOST = config.get("server.apiHost");

// //////////////////////////////////////////////////////////////////////////////
// per-environment plugins
const environmentPlugins = (() => {
  if (process.env.MINIFY) {
    return [
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|html|css)$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
    ];
  }

  switch (process.env.NODE_ENV) {
    case 'development':
      return [
        // Hot reloading is set up in webpack-dev-server.js
      ];

    default:
      return [];
  }
})();

module.exports = {
  mode: process.env.MINIFY ? 'production' : 'development',
  entry: {
    app: [
      'whatwg-fetch',
      'core-js/es6/object',
      'core-js/es6/array',
      'core-js/es6/symbol',
      'core-js/es6/promise',
      'core-js/es6/map',
      'core-js/es6/set',
      './entry/client.tsx',
    ],
  },

  optimization: process.env.MINIFY
    ? {
        splitChunks: {
          chunks: 'all',
          // cacheGroups: {
          //   commons: {
          //     test: /[\\/]node_modules[\\/]/,
          //     name: "vendors",
          //     chunks: "all",
          //   },
          // },
        },
      }
    : undefined,

  performance: {
    assetFilter(filename) {
      // Don't size test uncompressed javascript - we just care about the .js.gz files
      return !/\.(js|map)$/.test(filename);
    },
  },

  // https://github.com/TypeStrong/ts-loader#transpileonly-boolean-defaultfalseO
  stats: {
    warningsFilter: /export .* was not found in/,
  },

  plugins: [
    // Define global letiables in the client to instrument behavior.
    new webpack.DefinePlugin({
      // Flag to detect non-production
      __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
      __TEST__: "false",

      // ALlow switching on NODE_ENV in client code
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      "process.env.PUBLIC_HOST": JSON.stringify(process.env.PUBLIC_HOST)


     

    }),

    // Process index.html and insert script and stylesheet tags for us.
    new HtmlWebpackPlugin({
      template: './entry/index.html',
      inject: 'body',
    }),

    // Don't proceed in generating code if there are errors
    new webpack.NoEmitOnErrorsPlugin(),

    // Extract embedded css into a file
    new ExtractTextPlugin(
      process.env.MINIFY ? '[name].[chunkhash].css' : '[name].css',
    ),

    // Show a nice progress bar on the console.
    new ProgressBarPlugin({
      clear: false,
    }),

    // new webpack.debug.ProfilingPlugin({
    //   outputPath: "client-build.json"
    // }),

    // new HappyPack({
    //   id: "ts",
    //   threads: process.env.CI ? 1 : Math.max(1, os.cpus().length / 2 - 1),
    //   loaders: [
    //     {
    //       path: "ts-loader",
    //       query: { happyPackMode: true, configFile: "tsconfig.client.json" },
    //     },
    //   ],
    // }),
    new ForkTsCheckerWebpackPlugin({
      // typescript: {
      // https://github.com/Realytics/fork-ts-checker-webpack-plugin#options
      useTypescriptIncrementalApi: true,
      memoryLimit: 4096,
      // },
    }),

    // new CircularDependencyPlugin({
    //   // exclude detection of files based on a RegExp
    //   exclude: /a\.js|node_modules/,
    //   // include specific files based on a RegExp
    //   include: /modules/,
    //   // add errors to webpack instead of warnings
    //   failOnError: true,
    //   // allow import cycles that include an asyncronous import,
    //   // e.g. via import(/* webpackMode: "weak" */ './file.js')
    //   allowAsyncCycles: false,
    //   // set the current working directory for displaying module paths
    //   cwd: process.cwd(),
    // }),

    ...(process.env.ANALYZE
      ? [new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)()]
      : []),
  ].concat(environmentPlugins),

  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
    filename: process.env.MINIFY ? 'client.[chunkhash].js' : 'client.js',
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: [path.resolve(__dirname, '..'), 'node_modules'],
    alias: {
      '@material-ui/core': '@material-ui/core/es',
    },
    plugins: [new TsconfigPathsPlugin({})]
  },

  module: {
    rules: [
      {
        // Transpile non-IE compatible node modules.
        test: /\.jsx?$/,
        // Whitelist the modules inside the () in this regex:
        include: /node_modules\/(@material-ui)\//,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
                '@babel/plugin-proposal-optional-chaining',
                '@babel/plugin-proposal-nullish-coalescing-operator',
              ],
            },
          },
        ],
      },
      loaders.clientSideTypeScript,
      loaders.graphql,
      loaders.scss,
    ].concat(loaders.allImagesAndFontsArray),
  },
  devServer: {
    publicPath: '/',
    port: DEV_PORT,
    hot: false,
    historyApiFallback: true,
    stats: 'errors-only',
    disableHostCheck: config.get('devServer.disableHostCheck'),
    proxy: {
      '/graphql/*': `http://${PROXY_HOST}`,
      '/auth/*': `http://${PROXY_HOST}`,
      '/implicit/*': `http://${PROXY_HOST}`,
      '/arena/*': `http://${PROXY_HOST}`,
      '/api/*': `http://${PROXY_HOST}`,
    },
  },
};
