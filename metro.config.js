const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable web support
config.web = {
  bundler: 'metro'
};

// Fix for Metro bundler TerminalReporter exports issue
config.resolver.unstable_enablePackageExports = false;

module.exports = config;