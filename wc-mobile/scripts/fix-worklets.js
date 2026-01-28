/**
 * Fix script to create react-native-worklets alias
 * This is needed because react-native-reanimated v4 expects react-native-worklets/plugin
 * but the package is now called react-native-worklets-core
 */

const fs = require('fs');
const path = require('path');

const workletsDir = path.join(__dirname, '..', 'node_modules', 'react-native-worklets');
const workletsCoreDir = path.join(__dirname, '..', 'node_modules', 'react-native-worklets-core');

// Create directory if it doesn't exist
if (!fs.existsSync(workletsDir)) {
  fs.mkdirSync(workletsDir, { recursive: true });
}

// Create plugin.js that points to worklets-core
const pluginContent = `module.exports = require("../react-native-worklets-core/src/plugin");`;
fs.writeFileSync(path.join(workletsDir, 'plugin.js'), pluginContent);

// Create package.json
const packageJson = {
  name: 'react-native-worklets',
  version: '1.6.2',
  main: '../react-native-worklets-core/lib/commonjs/index',
  module: '../react-native-worklets-core/lib/module/index',
  types: '../react-native-worklets-core/lib/typescript/index.d.ts',
};
fs.writeFileSync(
  path.join(workletsDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('✅ react-native-worklets alias created successfully');
