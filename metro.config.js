const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// On web, replace native-only modules with empty shims
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const nativeOnly = [
      'react-native-view-shot',
      'react-native-purchases',
      'expo-media-library',
      'expo-sharing',
      'expo-speech',
    ];
    if (nativeOnly.includes(moduleName)) {
      return {
        filePath: require.resolve('./shims/empty.js'),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
