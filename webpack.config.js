/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    app: './src/main.ts',
    vendors: ['phaser'],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },

  devtool: 'inline-source-map',

  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },

  output: {
    filename: 'app.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },

  mode: 'development',

  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    writeToDisk: true,
    open: true,
    //host: '192.168.86.69', //your ip address
    //port: 8080,
    //disableHostCheck: true,
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'index.html',
        },
        {
          from: 'manifest.json',
        },
        {
          from: 'assets/**/*',
        },
      ],
    }),
    new webpack.DefinePlugin({
      'typeof CANVAS_RENDERER': JSON.stringify(true),
      'typeof WEBGL_RENDERER': JSON.stringify(true),
    }),
  ],

  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
