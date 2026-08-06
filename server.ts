import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsing middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Temp upload directory setup
const TEMP_DIR = path.join(process.cwd(), 'tmp_uploads');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
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
  const baseUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `${proto}://${host}`;
  const currentDate = new Date().toISOString().split('T')[0];

  const tools = [
    { id: 'edit-pdf', priority: '1.0', changefreq: 'daily' },
    { id: 'merge-pdf', priority: '0.9', changefreq: 'daily' },
    { id: 'split-pdf', priority: '0.9', changefreq: 'daily' },
    { id: 'compress-pdf', priority: '0.9', changefreq: 'daily' },
    { id: 'organize-pdf', priority: '0.8', changefreq: 'weekly' },
    { id: 'watermark-pdf', priority: '0.8', changefreq: 'weekly' },
    { id: 'lock-pdf', priority: '0.8', changefreq: 'weekly' },
    { id: 'unlock-pdf', priority: '0.8', changefreq: 'weekly' },
    { id: 'pdf-to-word', priority: '0.9', changefreq: 'daily' },
    { id: 'word-to-pdf', priority: '0.9', changefreq: 'daily' },
    { id: 'pdf-to-excel', priority: '0.9', changefreq: 'daily' },
    { id: 'excel-to-pdf', priority: '0.8', changefreq: 'weekly' },
    { id: 'pdf-to-image', priority: '0.9', changefreq: 'daily' },
    { id: 'image-to-pdf', priority: '0.9', changefreq: 'daily' },
    { id: 'ppt-to-pdf', priority: '0.8', changefreq: 'weekly' },
    { id: 'edit-word', priority: '0.8', changefreq: 'weekly' },
    { id: 'word-to-txt', priority: '0.7', changefreq: 'weekly' },
    { id: 'edit-excel', priority: '0.8', changefreq: 'weekly' },
    { id: 'csv-excel-converter', priority: '0.8', changefreq: 'weekly' },
    { id: 'image-converter', priority: '0.9', changefreq: 'daily' },
    { id: 'image-compressor', priority: '0.9', changefreq: 'daily' },
    { id: 'image-resizer', priority: '0.8', changefreq: 'weekly' },
    { id: 'ocr-reader', priority: '0.9', changefreq: 'daily' },
    { id: 'universal-converter', priority: '0.9', changefreq: 'daily' },
  ];

  const pages = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: 'about', priority: '0.7', changefreq: 'monthly' },
    { path: 'privacy', priority: '0.7', changefreq: 'monthly' },
    { path: 'terms', priority: '0.7', changefreq: 'monthly' },
    { path: 'disclaimer', priority: '0.7', changefreq: 'monthly' },
    { path: 'contact', priority: '0.7', changefreq: 'monthly' },
    { path: 'faq', priority: '0.8', changefreq: 'weekly' },
    { path: 'blog', priority: '0.8', changefreq: 'weekly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
  xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

  // Core Pages
  pages.forEach(p => {
    const url = p.path === '' ? `${baseUrl}/` : `${baseUrl}/${p.path}`;
    xml += `  <url>\n`;
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
    xml += `    <priority>${p.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  // Tool Pages (Direct Clean Path & Hash Route)
  tools.forEach(t => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/tool/${t.id}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${t.changefreq}</changefreq>\n`;
    xml += `    <priority>${t.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  res.send(xml);
});

// Serve Vite dev server or production static dist
function serveStatic() {
  const cwdDist = path.join(process.cwd(), 'dist');
  const distPath = fs.existsSync(path.join(cwdDist, 'index.html'))
    ? cwdDist
    : (fs.existsSync(path.join(__dirname, 'index.html')) ? __dirname : cwdDist);

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
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    fs.existsSync(path.join(process.cwd(), 'dist', 'index.html')) ||
    fs.existsSync(path.join(__dirname, 'index.html'));

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
