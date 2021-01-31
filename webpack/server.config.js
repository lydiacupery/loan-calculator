const path = require('path');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const fs = require('fs');

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const loaders = require('./loaders');

const lambdaDir = path.join(__dirname, '../entry/lambda');


const scriptsDir = path.join(__dirname, '../entry/scripts');

/** A map of of entry points for every file in scripts */
const scriptEntry = fs
  .readdirSync(scriptsDir)
  .filter((f) => /\.tsx?$/.test(f))
  .filter((f) => fs.statSync(path.join(scriptsDir, f)).isFile())
  .reduce((o, f) => {
    o[`scripts/${f.replace(/\.tsx?$/, '')}`] = path.resolve(
      path.join(scriptsDir, f),
    );
    return o;
  }, {});

const entry = {
  server: './entry/server.ts',
  ...scriptEntry,
  // 'scripts/load-data-from-dbo-to-public':
  //   './entry/scripts/load-data-from-dbo-to-public.ts',
};
console.info(entry);

module.exports = {
  entry,
  // Never minify the server
  mode: 'development',
  target: 'node',

  // devtool: "source-map",
  devtool: 'inline-source-map',
  optimization: {
    // Don't turn process.env.NODE_ENV into a compile-time constant
    nodeEnv: false,
  },
  context: `${__dirname}/../`,

  node: {
    __dirname: false,
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    libraryTarget: 'commonjs2',
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    modules: [path.resolve(__dirname, '..'), 'node_modules'],
  },

  externals: [
    nodeExternals({
      allowlist: [/^lodash-es/],
    }),
  ],
  module: {
    rules: [loaders.typescript, loaders.graphql],
  },

  // https://github.com/TypeStrong/ts-loader#transpileonly-boolean-defaultfalseO
  stats: {
    warningsFilter: /export .* was not found in/,
  },

  plugins: [
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false,
    }),

    new webpack.DefinePlugin({
      __TEST__: 'false',
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    }),

    ...(process.env.ANALYZE
      ? [new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)()]
      : []),

    // new webpack.debug.ProfilingPlugin({
    //   outputPath: "server-build.json"
    // }),

    // new HappyPack({
    //   id: "ts",pu
    //   threads: process.env.CI ? 1 : Math.max(1, os.cpus().length / 2 - 1),
    //   loaders: [
    //     {
    //       path: "ts-loader",
    //       query: { happyPackMode: true, configFile: "tsconfig.json" },
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
   
  ],
};
