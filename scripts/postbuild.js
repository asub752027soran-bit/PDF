import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

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
