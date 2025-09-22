const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable web support
config.web = {
  bundler: 'metro'
};

// Fix for Metro bundler TerminalReporter exports issue
config.resolver.unstable_enablePackageExports = false;

// Additional resolver configuration to handle package exports
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;