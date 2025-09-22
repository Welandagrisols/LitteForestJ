const { getDefaultConfig } = require('expo/metro-config');

// Get the default config
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Completely disable package exports to fix Metro bundler issue
config.resolver.unstable_enablePackageExports = false;

// Set resolver configuration for cross-platform support
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add additional transformer options for web support
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: false,
};

module.exports = config;