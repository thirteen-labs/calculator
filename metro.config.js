// TEMPORARY (verification only) - delete before finishing.
// expo-sqlite's web worker imports a .wasm module, which Metro does not treat
// as an asset by default, so the web bundle cannot resolve it.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [...config.resolver.assetExts, 'wasm'];

module.exports = config;
