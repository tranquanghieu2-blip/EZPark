
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["module:@react-native/babel-preset", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
        },
      ],
      ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: true
    }]
    ],
  };
};