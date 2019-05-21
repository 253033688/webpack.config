"use strict";

const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const portfinder = require("portfinder");
const FriendlyErrorsPlugin = require("friendly-errors-webpack-plugin");

const baseWebpackConfig = require("./webpack.base");
const packageConfig = require("../package.json");
const assetsPath = path.resolve(__dirname, "../dist/static");

const devWebpackConfig = merge(baseWebpackConfig, {
  devtool: "cheap-module-eval-source-map",
  optimization: {
    minimize: false
  },
  performance: {
    hints: false
  },
  devServer: {
    clientLogLevel: "warning",
    historyApiFallback: {
      rewrites: [
        { from: /.*/, to: path.posix.join(assetsPath, "index.html") },
      ],
    },
    hot: true,
    contentBase: false, // since we use CopyWebpackPlugin.
    compress: true,
    host: "localhost",
    port: "8000",
    open: false, // autoOpenBrowser
    overlay: { warnings: false, errors: true },
    publicPath: "/",
    proxy: {
      "/devenv": {
        target: "http://admin-beta.talkinggenie.com",
        pathRewrite: { "^/devenv": "" }
      }
    },
    quiet: true, // necessary for FriendlyErrorsPlugin
    watchOptions: {
      poll: true,
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: "\"development\"",
        BASE_URL: "\"/\""
      }
    }),
    new webpack.HotModuleReplacementPlugin(),
  ]
});

module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || devWebpackConfig.devServer.port;
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err);
    } else {
      process.env.PORT = port;
      devWebpackConfig.devServer.port = port;

      devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [`Your application is running here: http://${devWebpackConfig.devServer.host}:${port}`],
        },
        onErrors: () => {
          const notifier = require("node-notifier");

          return (severity, errors) => {
            if (severity !== "error") return;

            const error = errors[0];
            const filename = error.file && error.file.split("!").pop();

            notifier.notify({
              title: packageConfig.name,
              message: severity + ": " + error.name,
              subtitle: filename || "",
              icon: path.join(__dirname, "logo.png")
            });
          };
        }
      }));

      resolve(devWebpackConfig);
    }
  });
});
