const fs = require('fs');
const path = require('path');
const axios = require('axios');

const { resolveLogoAsset, validateArte, run } = require('../src/services/generator');
const { loadManifest } = require('../src/lib/manifestLoader');

jest.mock('axios');
jest.setTimeout(60000);

const PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAr8B9pgeakYAAAAASUVORK5CYII=',
  'base64',
);

const INPUT_DIR = path.resolve('input');
const TEST_BG = path.join(INPUT_DIR, 'test-bg.png');
const TEST_LOGO = path.join(INPUT_DIR, 'test-logo.png');
const TEST_OUTPUT = path.resolve('output', 'test-output');

function ensureInputFile(filePath) {
  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(filePath, PNG_BUFFER);
}

beforeAll(() => {
  ensureInputFile(TEST_BG);
  ensureInputFile(TEST_LOGO);
});

afterAll(() => {
  [TEST_BG, TEST_LOGO].forEach((file) => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
  if (fs.existsSync(TEST_OUTPUT)) {
    fs.rmSync(TEST_OUTPUT, { recursive: true, force: true });
  }
});

afterEach(() => {
  jest.clearAllMocks();
});

test('resolveLogoAsset resolves remote SVG and PNG', async () => {
  axios.get.mockResolvedValueOnce({ data: '<svg></svg>' });
  const svg = await resolveLogoAsset('https://example.com/logo.svg', 'Alt');
  expect(svg).toMatchObject({ kind: 'inline-svg', sourceType: 'remote', alt: 'Alt' });

  axios.get.mockResolvedValueOnce({ data: 'binary' });
  const png = await resolveLogoAsset('https://example.com/logo.png');
  expect(png).toMatchObject({ kind: 'image', src: 'https://example.com/logo.png' });
});

test('resolveLogoAsset resolves local assets (svg/png)', async () => {
  const localPng = await resolveLogoAsset(TEST_LOGO);
  expect(localPng.src).toContain('file:');
  expect(localPng.kind).toBe('image');
});

test('validateArte honors manifest logoField and defaultLogo', () => {
  const manifestInfo = loadManifest('fonte-hub', 'index');
  const arte = {
    template: 'fonte-hub',
    page: 'index',
    bg: 'https://example.com/bg.png',
  };

  const validated = validateArte(arte, manifestInfo.manifest);
  expect(validated['logo-fonte-hub']).toBe('logo-fonte-hub.svg');
});

test('run generates a PNG using manifest defaults', async () => {
  const arte = {
    template: 'layout-bbc',
    page: 'index',
    bg: 'test-bg',
  };

  const result = await run([arte], { outputDir: TEST_OUTPUT });
  expect(result.files).toHaveLength(1);
  const outputFile = path.join(TEST_OUTPUT, result.files[0]);
  expect(fs.existsSync(outputFile)).toBe(true);
});
