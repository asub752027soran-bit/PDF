import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

const distRedirectsPath = path.join(projectRoot, 'dist', '_redirects');
const publicRedirectsPath = path.join(projectRoot, 'public', '_redirects');

// 1. Remove dist/_redirects if it exists to prevent Cloudflare redirect loops
if (fs.existsSync(distRedirectsPath)) {
  try {
    fs.unlinkSync(distRedirectsPath);
    console.log('✅ Successfully removed dist/_redirects to prevent Cloudflare redirect loop.');
  } catch (err) {
    console.error('⚠️ Could not remove dist/_redirects:', err);
  }
} else {
  console.log('✅ Checked dist/_redirects: No conflicting _redirects file in build output.');
}

// 2. Remove public/_redirects if it somehow exists
if (fs.existsSync(publicRedirectsPath)) {
  try {
    fs.unlinkSync(publicRedirectsPath);
    console.log('✅ Successfully removed public/_redirects.');
  } catch (err) {
    console.error('⚠️ Could not remove public/_redirects:', err);
  }
}

// 3. Verify dist contains valid binary favicon assets for Google Search & SEO
const distDir = path.join(projectRoot, 'dist');
if (fs.existsSync(distDir)) {
  const requiredIcons = [
    'favicon.ico',
    'favicon-48x48.png',
    'favicon-96x96.png',
    'icon-192x192.png',
    'icon-512x512.png',
    'apple-touch-icon.png',
    'favicon.svg',
    'robots.txt',
    'sitemap.xml',
    'manifest.webmanifest'
  ];

  let missing = 0;
  for (const file of requiredIcons) {
    const p = path.join(distDir, file);
    if (!fs.existsSync(p)) {
      // copy from public if missing
      const srcP = path.join(publicDir, file);
      if (fs.existsSync(srcP)) {
        fs.copyFileSync(srcP, p);
        console.log(`📋 Copied missing ${file} to dist/`);
      } else {
        console.warn(`⚠️ Warning: ${file} not found in public/ or dist/`);
        missing++;
      }
    }
  }
  if (missing === 0) {
    console.log('🎯 All SEO & Favicon assets verified in dist/');
  }
}
