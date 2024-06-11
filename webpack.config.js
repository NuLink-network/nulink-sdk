const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const { experiments } = require('webpack');

module.exports = {
  entry: './src/index.ts', // 入口文件
  output: {
    filename: 'my-sdk.js', // 输出文件名
    publicPath: './',
    // publicPath: path.resolve(__dirname, 'dist'),
    path: path.resolve(__dirname, 'dist'), // 输出目录
    library: 'NUSDK', // 库名称
    libraryTarget: 'umd', // 打包格式
    globalObject: 'this', // 兼容node和浏览器运行
  },
  experiments: {
    asyncWebAssembly: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.wasm'],
    fallback: {
      "fs": false, // fs模块在浏览器环境中不可用
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/")
    }
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: "javascript/auto",
        use: {
          loader: "arraybuffer-loader",
        },
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  plugins: [
    new NodePolyfillPlugin()
  ],
  mode: 'production', // 设置模式为生产模式
};
