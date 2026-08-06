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
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(
`User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${process.env.APP_URL || `http://localhost:${PORT}`}/sitemap.xml`
  );
});

// Dynamic SEO Sitemap.xml
app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml');
  const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  const tools = [
    'edit-pdf', 'merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'watermark-pdf', 'lock-pdf', 'unlock-pdf',
    'pdf-to-word', 'word-to-pdf', 'pdf-to-excel', 'excel-to-pdf', 'pdf-to-image', 'image-to-pdf',
    'image-converter', 'image-compressor', 'image-resizer', 'ocr-reader', 'universal-converter'
  ];
  const pages = ['', 'about', 'privacy', 'terms', 'disclaimer', 'contact', 'faq', 'blog'];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  pages.forEach(p => {
    xml += `  <url>\n    <loc>${baseUrl}/${p}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${p === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
  });

  tools.forEach(t => {
    xml += `  <url>\n    <loc>${baseUrl}/#tool/${t}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  });

  xml += `</urlset>`;
  res.send(xml);
});

// Serve Vite dev server or production static dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDFEditfy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
