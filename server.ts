import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { generateSitemapXml } from './src/utils/sitemapGenerator';

const app = express();
const PORT = 3000;

// Enable trust proxy for Cloudflare / Google Cloud Run reverse proxying
app.set('trust proxy', true);

// Body parsing middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Temp upload directory setup in system temp directory (safe for container environments)
const TEMP_DIR = path.join(os.tmpdir(), 'pdfeditfy_uploads');
if (!fs.existsSync(TEMP_DIR)) {
  try {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create temp upload directory:', err);
  }
}

// Auto cleanup temporary files older than 15 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
setInterval(() => {
  try {
    const now = Date.now();
    const files = fs.readdirSync(TEMP_DIR);
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > 15 * 60 * 1000) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error('Error in temp file cleanup:', err);
  }
}, CLEANUP_INTERVAL);

// API Health Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'PDF Editfy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    privacyNotice: 'Uploaded temporary processing files are purged automatically within 15 minutes.',
  });
});

// --- Short Image URL Storage & Streaming API ---
interface ShortImageData {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
  createdAt: number;
  customSlug?: string;
  publicCloudUrl?: string;
}

const shortImageMemoryCache = new Map<string, ShortImageData>();
const SHORT_IMAGES_DIR = path.join(TEMP_DIR, 'short_images');
if (!fs.existsSync(SHORT_IMAGES_DIR)) {
  try {
    fs.mkdirSync(SHORT_IMAGES_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create short images dir:', err);
  }
}

// Save image to short URL storage
app.post('/api/short', (req, res) => {
  try {
    const { id, name, mimeType, dataUrl, width, height, size, customSlug, publicCloudUrl } = req.body;
    if (!id || !dataUrl) {
      return res.status(400).json({ error: 'Missing required parameters: id and dataUrl are required' });
    }

    const cleanId = String(id).trim();
    const cleanSlug = customSlug ? String(customSlug).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : undefined;

    const item: ShortImageData = {
      id: cleanId,
      name: name || 'image.png',
      mimeType: mimeType || 'image/png',
      dataUrl: String(dataUrl),
      width: Number(width) || 500,
      height: Number(height) || 500,
      size: Number(size) || dataUrl.length,
      createdAt: Date.now(),
      customSlug: cleanSlug,
      publicCloudUrl: publicCloudUrl || undefined
    };

    // Store in memory cache
    shortImageMemoryCache.set(cleanId, item);
    if (cleanSlug) {
      shortImageMemoryCache.set(cleanSlug, item);
    }

    // Persist to filesystem for container resilience
    try {
      const filePath = path.join(SHORT_IMAGES_DIR, `${cleanId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(item), 'utf-8');
      if (cleanSlug) {
        const slugFilePath = path.join(SHORT_IMAGES_DIR, `slug_${cleanSlug}.json`);
        fs.writeFileSync(slugFilePath, JSON.stringify(item), 'utf-8');
      }
    } catch (fsErr) {
      console.debug('Short image filesystem persist note:', fsErr);
    }

    const host = req.headers.host || 'pdfeditfy.com';
    const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
    const baseUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `${proto}://${host}`;
    const key = cleanSlug || cleanId;

    res.json({
      success: true,
      id: cleanId,
      customSlug: cleanSlug,
      shortUrl: `${baseUrl}/tool/image-to-url?img=${encodeURIComponent(key)}`,
      viewUrl: `${baseUrl}/i/${encodeURIComponent(key)}`,
      rawUrl: `${baseUrl}/api/short/raw/${encodeURIComponent(key)}`
    });
  } catch (err: any) {
    console.error('Error saving short image:', err);
    res.status(500).json({ error: 'Failed to save short image', details: err?.message });
  }
});

// Helper to look up short image
function findShortImage(idOrSlug: string): ShortImageData | null {
  const cleanKey = decodeURIComponent(idOrSlug).trim();

  // 1. Check memory cache
  if (shortImageMemoryCache.has(cleanKey)) {
    return shortImageMemoryCache.get(cleanKey)!;
  }

  // 2. Check filesystem
  try {
    const idPath = path.join(SHORT_IMAGES_DIR, `${cleanKey}.json`);
    if (fs.existsSync(idPath)) {
      const data = JSON.parse(fs.readFileSync(idPath, 'utf-8'));
      shortImageMemoryCache.set(cleanKey, data);
      return data;
    }

    const slugPath = path.join(SHORT_IMAGES_DIR, `slug_${cleanKey}.json`);
    if (fs.existsSync(slugPath)) {
      const data = JSON.parse(fs.readFileSync(slugPath, 'utf-8'));
      shortImageMemoryCache.set(cleanKey, data);
      return data;
    }
  } catch (err) {
    console.debug('Short image filesystem lookup note:', err);
  }

  return null;
}

// Retrieve short image metadata + dataUrl
app.get('/api/short/:id', (req, res) => {
  const item = findShortImage(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Short image not found or expired', id: req.params.id });
  }
  res.json(item);
});

// Serve direct raw image binary for <img> tags / external embeds
app.get(['/api/short/raw/:id', '/raw/:id'], (req, res) => {
  const rawId = req.params.id.replace(/\.(png|jpe?g|webp|svg|gif|ico|avif)$/i, '');
  const item = findShortImage(rawId) || findShortImage(req.params.id);

  if (!item || !item.dataUrl) {
    return res.status(404).send('Image not found');
  }

  try {
    const parts = item.dataUrl.split(';base64,');
    const mimeType = parts[0]?.replace('data:', '') || item.mimeType || 'image/png';
    const base64Data = parts[1] || '';
    const imgBuffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', imgBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(item.name)}"`);
    res.send(imgBuffer);
  } catch (err) {
    console.error('Error serving raw short image:', err);
    res.status(500).send('Error rendering image');
  }
});

// Direct Short URL Routes: /i/:id, /s/:id, /img/:id
app.get(['/i/:id', '/s/:id', '/img/:id', '/short/:id'], (req, res, next) => {
  const rawId = req.params.id;
  const acceptHeader = req.headers.accept || '';

  // If directly requesting image binary via extension or Accept header
  if (rawId.match(/\.(png|jpe?g|webp|svg|gif|ico|avif)$/i) || (acceptHeader.includes('image/') && !acceptHeader.includes('text/html'))) {
    const item = findShortImage(rawId.replace(/\.(png|jpe?g|webp|svg|gif|ico|avif)$/i, '')) || findShortImage(rawId);
    if (item && item.dataUrl) {
      const parts = item.dataUrl.split(';base64,');
      const mimeType = parts[0]?.replace('data:', '') || item.mimeType || 'image/png';
      const base64Data = parts[1] || '';
      const imgBuffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', imgBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(item.name)}"`);
      return res.send(imgBuffer);
    }
  }

  // Otherwise, pass to SPA handler so App.tsx can render the interactive ImageToUrl viewer
  next();
});

// Dynamic SEO Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  const host = req.headers.host || 'pdfeditfy.com';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const baseUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `${proto}://${host}`;

  res.send(
`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml`
  );
});

// Dynamic SEO Sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  const host = req.headers.host || 'pdfeditfy.com';
  const proto = (req.headers['x-forwarded-proto'] as string) || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const defaultDomain = `${proto}://${host}`;
  const baseUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : defaultDomain;

  const xml = generateSitemapXml(baseUrl);
  res.send(xml);
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build index.html not found. Please run "npm run build" first.');
      }
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev server initialization failed, falling back to static files:', err);
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Build index.html not found');
        }
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDFEditfy server running on http://0.0.0.0:${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });
}

startServer();
