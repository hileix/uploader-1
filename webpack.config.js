const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const config = {
  mode: 'development',
  entry: './example/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.(ts)?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: true
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  devServer: {
    contentBase: './dist',
    open: 'Google Chrome',
    disableHostCheck: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'webuploader',
      template: './public/index.html'
    })
  ]
}

module.exports = config
