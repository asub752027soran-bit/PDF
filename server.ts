import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { generateSitemapXml } from './src/utils/sitemapGenerator';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
    app: 'PDFEditfy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    privacyNotice: 'Uploaded temporary processing files are purged automatically within 15 minutes.',
  });
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
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml`
  );
});

// Dynamic SEO Sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  const host = req.headers.host || 'pdfeditfy.com';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const defaultDomain = (host.includes('localhost') || host.includes('127.0.0.1')) ? `${proto}://${host}` : 'https://pdfeditfy.com';
  const baseUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : defaultDomain;

  const xml = generateSitemapXml(baseUrl);
  res.send(xml);
});

// Serve Vite dev server or production static dist
function serveStatic() {
  const possibleDistPaths = [
    path.join(process.cwd(), 'dist'),
    __dirname,
    path.join(__dirname, '..', 'dist'),
    path.join(__dirname, 'dist')
  ];
  const distPath = possibleDistPaths.find(p => fs.existsSync(path.join(p, 'index.html'))) || path.join(process.cwd(), 'dist');

  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Build index.html not found. Please run "npm run build" first.');
    }
  });
}

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    serveStatic();
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, allowedHosts: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev server initialization failed, falling back to static files:', err);
      serveStatic();
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDFEditfy server running on http://0.0.0.0:${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });
}

startServer();
