const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ProvidePlugin } = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  mode: process.env.NODE_ENV || 'development',
  
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "assert": require.resolve("assert"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify"),
      "url": require.resolve("url"),
      "zlib": require.resolve("browserify-zlib"),
      "path": require.resolve("path-browserify"),
      "fs": false,
      "net": false,
      "tls": false
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@contracts': path.resolve(__dirname, 'src/contracts'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@components': path.resolve(__dirname, 'src/components')
    }
  },
  
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /\.json$/,
        type: 'json'
      }
    ]
  },
  
  plugins: [
    new NodePolyfillPlugin(),
    new ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ],
  
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    allowedHosts: 'all'
  },
  
  optimization: {
    splitChunks: {
      cacheGroups: {
        web3: {
          test: /[\\/]node_modules[\\/](web3|ethers|@metamask|@walletconnect)[\\/]/,
          name: 'web3-libs',
          chunks: 'all',
          priority: 10
        }
      }
    }
  }
};