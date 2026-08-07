import { TOOLS } from '../data/toolsData';
import { BLOG_POSTS } from '../data/blogData';

export function generateSitemapXml(customDomain?: string): string {
  const domain = customDomain || 'https://pdfeditfy.com';
  const baseUrl = domain.replace(/\/$/, '');
  const currentDate = new Date().toISOString().split('T')[0];

  const staticPages = [
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

  // 1. Static Pages
  staticPages.forEach(p => {
    const url = p.path === '' ? `${baseUrl}/` : `${baseUrl}/${p.path}`;
    xml += `  <url>\n`;
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
    xml += `    <priority>${p.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  // 2. Dynamic Tool Pages (Both clean paths and direct hash routes for indexing)
  TOOLS.forEach(tool => {
    const priority = tool.badge === 'Popular' ? '0.9' : '0.8';
    const changefreq = tool.badge === 'Popular' ? 'daily' : 'weekly';

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/tool/${tool.id}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += `  </url>\n`;

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/#${tool.id}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  // 3. Dynamic Blog Article Pages
  BLOG_POSTS.forEach(post => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;
  return xml;
}
