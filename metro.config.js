const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable web support
config.web = {
  bundler: 'metro'
};

module.exports = config;