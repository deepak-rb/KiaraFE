module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Ignore source map warnings for node_modules
      webpackConfig.ignoreWarnings = [
        {
          module: /node_modules\/react-datepicker/,
          message: /Failed to parse source map/,
        },
        function(warning) {
          return (
            warning.module &&
            warning.module.resource &&
            warning.module.resource.includes('node_modules') &&
            warning.message &&
            warning.message.includes('Failed to parse source map')
          );
        }
      ];

      // Alternative: Disable source map loader for node_modules
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.enforce === 'pre' && rule.use) {
          rule.use.forEach((useEntry) => {
            if (typeof useEntry === 'object' && useEntry.loader && useEntry.loader.includes('source-map-loader')) {
              useEntry.exclude = /node_modules/;
            }
          });
        }
      });

      return webpackConfig;
    },
  },
  eslint: {
    enable: false, // Disable ESLint plugin to avoid warnings
  },
};
