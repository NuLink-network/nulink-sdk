const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const { experiments, DefinePlugin } = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './src/index.ts', // 入口文件
  output: {
    filename: 'nulink-sdk.js', // 输出文件名
    publicPath: './',
    // publicPath: path.resolve(__dirname, 'dist'),
    path: path.resolve(__dirname, 'build'), // 输出目录
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
    new NodePolyfillPlugin(),
    // new DefinePlugin({
    //   'process.env.REACT_APP_CENTRALIZED_SERVER_URL': JSON.stringify(process.env.REACT_APP_CENTRALIZED_SERVER_URL)
    // }),
    //注意使用了 dotenv-webpack 不支持行内注释
    new Dotenv({
      path: './.env', // 指定 .env 文档的路径
      safe: false, // true 加载 .env.example 文档作为安全参考, 确保所有必需的环境变量都被定义。
      systemvars: true, // 允许使用系统环境变量
      silent: false, // 隐藏警告, 如果需要打印日志则需要改为false
      defaults: false // 不使用 .env.defaults 文档
    })
  ],
  mode: 'production', // 设置模式为生产模式
};
