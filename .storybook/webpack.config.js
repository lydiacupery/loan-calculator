const path = require('path');
const loaders = require('../webpack/loaders');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
var HappyPack = require('happypack');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const os = require('os');
const webpack = require('webpack');

// Export a function. Accept the base config as the only param.
module.exports = ({ config: storybookBaseConfig }) => {
  // configType has a value of 'DEVELOPMENT' or 'PRODUCTION'
  // You can change the configuration based on that.
  // 'PRODUCTION' is used when building the static version of storybook.

  // Make whatever fine-grained changes you need
  storybookBaseConfig.module.rules.push(
    loaders.mjs,
    loaders.clientSideTypeScript,
    loaders.graphql,
  );

  storybookBaseConfig.resolve.extensions.push('.ts', '.tsx');
  storybookBaseConfig.resolve.modules.unshift(path.resolve(__dirname, '..'));

  storybookBaseConfig.plugins.push(
    //   new HappyPack({
    //     id: "ts",
    //     threads: Math.max(1, os.cpus().length / 2 - 1),
    //     loaders: [
    //       {
    //         path: "ts-loader",
    //         query: { happyPackMode: true, configFile: "tsconfig.client.json" }
    //       }
    //     ]
    //   }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        memoryLimit: 4096,
      },
    }),
    new webpack.DefinePlugin({
      // Flag to detect non-production
      __TEST__: 'false',
      CONFIG: JSON.stringify({}),
    }),
  );
  // Return the altered config
  return storybookBaseConfig;
};
