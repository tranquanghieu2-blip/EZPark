const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)

// Bật full source map để stack trace hiện file gốc (webpack:///./src/…)
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  }),
  enableBabelRCLookup: true,
  sourceMap: true,
};

// Một số bundle có thể dùng .cjs → thêm vào extensions
if (!config.resolver.sourceExts.includes("cjs")) {
  config.resolver.sourceExts.push("cjs");
}
 
module.exports = withNativeWind(config, { input: './global.css' })
