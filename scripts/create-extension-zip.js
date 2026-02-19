#!/usr/bin/env node

/**
 * Script to build extension and create a downloadable ZIP file
 * Run: pnpm package:extension
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rootDir = path.resolve(__dirname, '..');
const DIST_DIR = path.join(rootDir, 'dist');
const RELEASE_DIR = path.join(rootDir, 'releases');
const ZIP_NAME = `cosmos-ai-extension-${new Date().toISOString().split('T')[0]}.zip`;
const ZIP_PATH = path.join(RELEASE_DIR, ZIP_NAME);

console.log('🚀 Starting Cosmos AI Extension Build & Package...\n');

// Step 1: Create releases directory if not exists
if (!fs.existsSync(RELEASE_DIR)) {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  console.log(`✅ Created releases directory\n`);
}

// Step 2: Clean old dist
console.log('🧹 Cleaning old builds...');
if (fs.existsSync(DIST_DIR)) {
  execSync(`rmdir /s /q "${DIST_DIR}"`, { stdio: 'inherit', shell: 'cmd.exe' });
}

// Step 3: Build entire project (pages + chrome-extension)
console.log('\n🔨 Building entire project...');
try {
  execSync('pnpm build', {
    cwd: rootDir,
    stdio: 'inherit',
    shell: 'cmd.exe',
  });
  console.log('\n✅ Build complete!\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 4: Create ZIP file
console.log(`📦 Creating ZIP file: ${ZIP_NAME}`);

(async () => {
  try {
    const output = fs.createWriteStream(ZIP_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`\n✅ ZIP created successfully!`);
      console.log(`📊 Size: ${sizeInMB} MB`);
      console.log(`📍 Location: ${ZIP_PATH}\n`);
      console.log('🎯 Installation Instructions:');
      console.log('1. Download and extract the ZIP');
      console.log('2. Go to chrome://extensions/');
      console.log('3. Turn ON "Developer mode" (top-right)');
      console.log('4. Click "Load unpacked"');
      console.log('5. Select the extracted folder');
      console.log('6. ✨ Done! Extension is now active!\n');
    });

    archive.on('error', err => {
      console.error('❌ ZIP creation failed:', err);
      process.exit(1);
    });

    archive.pipe(output);

    // Add all files from dist directory directly (no wrapper folder)
    if (fs.existsSync(DIST_DIR)) {
      archive.directory(DIST_DIR, false);
    } else {
      console.error('❌ dist directory not found!');
      process.exit(1);
    }

    await archive.finalize();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
