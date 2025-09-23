const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = function override(config, env) {
  // Production optimizations
  if (env === 'production') {
    // Terser configuration for better minification
    config.optimization = {
      ...config.optimization,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: { ecma: 8 },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log']
            },
            mangle: { safari10: true },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true
            }
          },
          parallel: true,
        })
      ],
      // Code splitting
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          defaultVendors: false,
          // React and React-DOM
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
            name: 'react',
            priority: 20,
            enforce: true
          },
          // MUI and emotion
          mui: {
            test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
            name: 'mui',
            priority: 15,
            enforce: true
          },
          // Redux and related
          redux: {
            test: /[\\/]node_modules[\\/](@reduxjs|redux|react-redux)[\\/]/,
            name: 'redux',
            priority: 14,
            enforce: true
          },
          // Firebase
          firebase: {
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            name: 'firebase',
            priority: 13,
            enforce: true
          },
          // Other large libraries
          libs: {
            test: /[\\/]node_modules[\\/](axios|date-fns|dayjs|formik|yup|i18next)[\\/]/,
            name: 'libs',
            priority: 10,
            enforce: true
          },
          // All other vendor modules
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 5,
            enforce: true,
            reuseExistingChunk: true
          },
          // Common modules
          common: {
            minChunks: 2,
            priority: 0,
            reuseExistingChunk: true
          }
        }
      },
      runtimeChunk: 'single',
      moduleIds: 'deterministic'
    };

    // Add compression plugin for gzip
    config.plugins.push(
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8
      })
    );

    // Add compression plugin for brotli
    config.plugins.push(
      new CompressionPlugin({
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8,
        filename: '[path][base].br'
      })
    );

    // Bundle analyzer (only when ANALYZE=true)
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'bundle-report.html'
        })
      );
    }
  }

  // Performance hints
  config.performance = {
    hints: env === 'production' ? 'warning' : false,
    maxEntrypointSize: 250000,
    maxAssetSize: 250000,
    assetFilter: function(assetFilename) {
      return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
    }
  };

  // Module resolution optimizations
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      // Use production React build
      'react': 'react/cjs/react.production.min.js',
      'react-dom': 'react-dom/cjs/react-dom.production.min.js'
    }
  };

  return config;
};