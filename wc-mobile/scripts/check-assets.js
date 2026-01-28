const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP_JSON_PATH = path.join(ROOT, 'app.json');
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const readPngSize = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24) {
    throw new Error('File too small to be a PNG');
  }
  const signature = buffer.slice(0, 8);
  if (!signature.equals(PNG_SIGNATURE)) {
    throw new Error('Not a PNG file');
  }
  const chunkType = buffer.slice(12, 16).toString('ascii');
  if (chunkType !== 'IHDR') {
    throw new Error('Missing IHDR chunk');
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
};

const resolveAsset = (assetPath) => {
  if (!assetPath) return null;
  return path.resolve(ROOT, assetPath);
};

if (!fs.existsSync(APP_JSON_PATH)) {
  console.error('[FAIL] app.json not found');
  process.exit(1);
}

const appConfig = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
const expo = appConfig.expo || {};

const assetChecks = [
  {
    name: 'icon',
    path: expo.icon,
    rules: { square: true, min: 1024 },
  },
  {
    name: 'splash',
    path: expo.splash?.image,
    rules: { square: false, min: 1024 },
  },
  {
    name: 'adaptiveIcon',
    path: expo.android?.adaptiveIcon?.foregroundImage,
    rules: { square: true, min: 432 },
  },
  {
    name: 'favicon',
    path: expo.web?.favicon,
    rules: { square: true, min: 48 },
  },
];

let hasErrors = false;

assetChecks.forEach((asset) => {
  if (!asset.path) {
    console.error(`[FAIL] ${asset.name}: missing path in app.json`);
    hasErrors = true;
    return;
  }
  const resolvedPath = resolveAsset(asset.path);
  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    console.error(`[FAIL] ${asset.name}: file not found (${asset.path})`);
    hasErrors = true;
    return;
  }

  try {
    const { width, height } = readPngSize(resolvedPath);
    const issues = [];

    if (asset.rules.square && width !== height) {
      issues.push('not square');
    }
    if (asset.rules.min && (width < asset.rules.min || height < asset.rules.min)) {
      issues.push(`smaller than ${asset.rules.min}px`);
    }

    if (issues.length > 0) {
      console.error(
        `[FAIL] ${asset.name}: ${width}x${height} (${issues.join(', ')}) -> ${asset.path}`
      );
      hasErrors = true;
      return;
    }

    console.log(`[OK] ${asset.name}: ${width}x${height} -> ${asset.path}`);
  } catch (error) {
    console.error(`[FAIL] ${asset.name}: ${error.message} (${asset.path})`);
    hasErrors = true;
  }
});

if (hasErrors) {
  process.exit(1);
}

console.log('Asset check passed.');
