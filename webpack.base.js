"use strict";

const path = require("path");
const webpack = require("webpack");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InlineManifestWebpackPlugin = require('inline-manifest-webpack-plugin')
const PreloadPlugin = require("@vue/preload-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const resolve = (dir = "") => {
  return path.join(__dirname, "..", dir);
};
const createStyleLoader = (scssFlag = false, isModules = false, isMobile = false) => {
  const importLoaders = scssFlag && isMobile ? 2 : scssFlag || isMobile ? 1 : 0
  let loaders
  if (process.env.NODE_ENV === 'production') {
    loaders = [{ loader: MiniCssExtractPlugin.loader }]
  } else {
    loaders = ["vue-style-loader"];
  }

  if (isModules) {
    loaders.push({
      loader: "css-loader",
      options: {
        modules: true,
        localIdentName: "[name]_[local]_[hash:base64:5]",
        importLoaders
      }
    });
  } else {
    loaders.push({
      loader: "css-loader",
      options: {
        importLoaders
      }
    });
  }

  if (isMobile) {
    loaders.push({
      loader: "px2rem-loader",
      options: {
        remUnit: 75,
        remPrecision: 8
      }
    });
  }

  loaders.push('postcss-loader')

  if (scssFlag) {
    loaders.push("sass-loader",
      // {
      //   loader: "sass-resources-loader",
      //   options: {
      //     resources: [
      //       path.resolve(__dirname, "../src/assets/scss/injection.scss")
      //     ]
      //   }
      // }
    );
  }

  return loaders;
};

module.exports = {
  mode: process.env.NODE_ENV === "develop" ? "develop" : "production",
  context: resolve(),
  entry: {
    app: path.join(__dirname, '../src/index.js')
  },
  output: {
    path: resolve("dist"),
    filename: "[name].js",
    publicPath: process.env.NODE_ENV === "production" ? "/" : "/"
  },
  resolve: {
    extensions: [".js", ".jsx", ".vue", ".json"],
    alias: {
      "vue$": "vue/dist/vue.runtime.esm.js",
      "@": path.resolve(__dirname, '../src/'),
    },
    modules: [resolve("node_modules"),]
  },
  module: {
    noParse: /^(vue|vue-router|vuex|vuex-router-sync|element-ui|echarts|lodash|moment)$/,
    rules: [
      {
        test: /\.vue$/,
        use: ["cache-loader", {
          loader: "vue-loader",
          options: {
            compilerOptions: {
              preserveWhitespace: false
            },
          }
        }],
      },
      {
        test: /\.(png|jpe?g|gif|webp)(\?.*)?$/,
        loader: "url-loader",
        options: {
          limit: 4096,
          name: path.posix.join("static", "img", "[name].[hash:8].[ext]")
        }
      },
      {
        test: /\.(svg)(\?.*)?$/,
        loader: "file-loader",
        options: {
          name: path.posix.join("static", "img", "[name].[hash:8].[ext]")
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: "url-loader",
        options: {
          limit: 4096,
          name: path.posix.join("static", "media", "[name].[hash:8].[ext]")
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
        loader: "url-loader",
        options: {
          limit: 4096,
          name: path.posix.join("static", "fonts", "[name].[hash:8].[ext]")
        }
      },
      {
        test: /\.css$/,
        oneOf: [
          {
            resourceQuery: /module/,
            use: createStyleLoader(false, true)
          },
          {
            use: createStyleLoader()
          }
        ]
      },
      {
        test: /\.scss$/,
        oneOf: [
          {
            resourceQuery: /module/,
            use: createStyleLoader(true, true)
          },
          {
            use: createStyleLoader(true)
          }
        ]
      },
      {
        test: /\.m?jsx?$/,
        use: ["cache-loader", "babel-loader?cacheDirectory"],
        include: [resolve("src"), resolve("test")]
      },
      {
        enforce: "pre",
        test: /\.(vue|(j|t)sx?)$/,
        include: [resolve("src"), resolve("test")],
        loader: "eslint-loader",
        options: {
          cache: true,
          emitWarning: true,
          emitError: false,
        }
      },
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new CaseSensitivePathsPlugin(),
    new webpack.ProgressPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true,
      favicon: path.resolve(__dirname, '..', 'favicon.ico'),
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      },
      chunksSortMode: 'dependency'
    }),
    new InlineManifestWebpackPlugin('manifest'),
    new PreloadPlugin({
      rel: "preload",
      include: "initial",
      fileBlacklist: [
        /\.map$/,
        /hot-update\.js$/
      ]
    }),
    new PreloadPlugin({
      rel: "prefetch",
      include: "asyncChunks"
    })
  ],
  node: {
    setImmediate: false,
    process: "mock",
    dgram: "empty",
    fs: "empty",
    net: "empty",
    tls: "empty",
    child_process: "empty"
  },
};
