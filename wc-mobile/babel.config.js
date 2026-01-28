module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-reanimated/plugin",
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
            "@/api": "./src/api",
            "@/core": "./src/core",
            "@/components": "./src/components",
            "@/design": "./src/design",
            "@/features": "./src/features",
            "@/i18n": "./src/i18n",
            "@/utils": "./src/utils",
            "@/assets": "./src/assets",
          },
        },
      ],
    ],
  };
};
