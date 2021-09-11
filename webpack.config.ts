import { resolve } from "path";

import * as webpack from "webpack";
import * as devServer from "webpack-dev-server";

import HtmlWebpackPlugin from "html-webpack-plugin";

export const config: webpack.Configuration & {
  devServer?: devServer.Configuration;
} = {
  entry: resolve(__dirname, "src/index.ts"),
  output: {
    filename: "bundle.js",
    path: resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.worker\.js$/,
        use: { loader: "worker-loader", options: { esModule: false } },

      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  externals: {
    "yandex-maps": "ymaps",
  },

  devtool: "eval-source-map",

  devServer: {
    allowedHosts: "all",
    static: { directory: resolve(__dirname, "dist") },
    compress: true,
    port: 9000,
    hot: false,
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: resolve(__dirname, "src/index.html"),
      filename: resolve(__dirname, "index.html"),
    }),
    new HtmlWebpackPlugin({
      template: resolve(__dirname, "src/index.html"),
      filename: resolve(__dirname, "dist/index.html"),
    }),
  ],
};

export default config;
