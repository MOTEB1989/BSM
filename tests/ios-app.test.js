#!/usr/bin/env node

/**
 * iOS App Validation Test
 * Validates the structure and integrity of the iOS app
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const iosAppDir = join(rootDir, 'ios-app');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
    failedTests++;
  }
}

console.log('🧪 Testing iOS App Structure and Integrity\n');

// Test 1: Directory exists
test('iOS app directory exists', () => {
  if (!existsSync(iosAppDir)) {
    throw new Error('ios-app directory not found');
  }
});

// Test 2: index.html exists and is valid
test('index.html exists and is valid', () => {
  const indexPath = join(iosAppDir, 'index.html');
  if (!existsSync(indexPath)) {
    throw new Error('index.html not found');
  }
  const content = readFileSync(indexPath, 'utf8');
  if (!content.includes('<!DOCTYPE html>')) {
    throw new Error('index.html missing DOCTYPE');
  }
  if (!content.includes('CoreHub Nexus')) {
    throw new Error('index.html missing CoreHub Nexus title');
  }
  if (!content.includes('manifest.json')) {
    throw new Error('index.html missing manifest link');
  }
});

// Test 3: app.js exists and is valid
test('app.js exists and is valid', () => {
  const appPath = join(iosAppDir, 'app.js');
  if (!existsSync(appPath)) {
    throw new Error('app.js not found');
  }
  const content = readFileSync(appPath, 'utf8');
  if (!content.includes('createApp')) {
    throw new Error('app.js missing Vue createApp');
  }
  if (!content.includes('sendMessage')) {
    throw new Error('app.js missing sendMessage method');
  }
});

// Test 4: manifest.json exists and is valid
test('manifest.json exists and is valid', () => {
  const manifestPath = join(iosAppDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error('manifest.json not found');
  }
  const content = readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(content);
  
  if (!manifest.name) {
    throw new Error('manifest.json missing name');
  }
  if (!manifest.short_name) {
    throw new Error('manifest.json missing short_name');
  }
  if (!manifest.start_url) {
    throw new Error('manifest.json missing start_url');
  }
  if (!manifest.display || manifest.display !== 'standalone') {
    throw new Error('manifest.json display should be standalone');
  }
  if (!manifest.theme_color) {
    throw new Error('manifest.json missing theme_color');
  }
});

// Test 5: Service Worker exists and is valid
test('sw.js exists and is valid', () => {
  const swPath = join(iosAppDir, 'sw.js');
  if (!existsSync(swPath)) {
    throw new Error('sw.js not found');
  }
  const content = readFileSync(swPath, 'utf8');
  if (!content.includes('install')) {
    throw new Error('sw.js missing install event');
  }
  if (!content.includes('fetch')) {
    throw new Error('sw.js missing fetch event');
  }
  if (!content.includes('CACHE_NAME')) {
    throw new Error('sw.js missing CACHE_NAME constant');
  }
});

// Test 6: README.md exists
test('README.md exists', () => {
  const readmePath = join(iosAppDir, 'README.md');
  if (!existsSync(readmePath)) {
    throw new Error('README.md not found');
  }
  const content = readFileSync(readmePath, 'utf8');
  if (!content.includes('CoreHub Nexus')) {
    throw new Error('README.md missing CoreHub Nexus reference');
  }
});

// Test 7: DEPLOYMENT.md exists
test('DEPLOYMENT.md exists', () => {
  const deployPath = join(iosAppDir, 'DEPLOYMENT.md');
  if (!existsSync(deployPath)) {
    throw new Error('DEPLOYMENT.md not found');
  }
  const content = readFileSync(deployPath, 'utf8');
  if (!content.includes('Cloudflare')) {
    throw new Error('DEPLOYMENT.md missing Cloudflare instructions');
  }
});

// Test 8: Express route exists in src/app.js
test('Express route for /ios-app exists', () => {
  const appJsPath = join(rootDir, 'src', 'app.js');
  if (!existsSync(appJsPath)) {
    throw new Error('src/app.js not found');
  }
  const content = readFileSync(appJsPath, 'utf8');
  if (!content.includes('/ios-app')) {
    throw new Error('src/app.js missing /ios-app route');
  }
  if (!content.includes('ios-app')) {
    throw new Error('src/app.js not serving ios-app directory');
  }
});

console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log('='.repeat(50));

if (failedTests > 0) {
  console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed! iOS app is ready for deployment.');
  process.exit(0);
}
