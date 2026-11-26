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
    'manifest.webmanifest',
    'ads.txt',
    'sw.js'
  ];

  const isValidBinaryIcon = (filePath, fileName) => {
    try {
      const buf = fs.readFileSync(filePath);
      if (fileName.endsWith('.png')) {
        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        return buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      }
      if (fileName.endsWith('.ico')) {
        // ICO header: 00 00 01 00 and no UTF-8 replacement character EF BF BD
        return buf.length > 6 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00 && !buf.includes(Buffer.from([0xef, 0xbf, 0xbd]));
      }
      return buf.length > 0;
    } catch {
      return false;
    }
  };

  let missing = 0;
  let corrupted = 0;
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
        continue;
      }
    }
    if ((file.endsWith('.png') || file.endsWith('.ico')) && !isValidBinaryIcon(p, file)) {
      console.error(`❌ Corrupted binary icon detected in dist/${file}`);
      corrupted++;
    }
  }
  if (missing === 0 && corrupted === 0) {
    console.log('🎯 All SEO & Favicon assets verified as valid binaries in dist/');
  } else if (corrupted > 0) {
    process.exitCode = 1;
  }
}
