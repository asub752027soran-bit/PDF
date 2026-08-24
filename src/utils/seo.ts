import { ToolItem, AdminConfig } from '../types';
import { TOOL_SEO_DETAILS } from '../data/toolSeoData';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SeoOptions {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  noindex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: Array<{ question: string; answer: string }>;
  softwareApp?: {
    name: string;
    description: string;
    url: string;
    category?: string;
  };
  gscVerificationCode?: string;
}

/**
 * Updates document head with comprehensive White-Hat SEO tags, canonical URL, Open Graph, Twitter Cards, and Schema.org JSON-LD structured data.
 */
export function updateSEOMeta(options: SeoOptions) {
  const {
    title,
    description,
    canonicalUrl,
    ogType = 'website',
    ogImage = 'https://pdfeditfy.com/icon-512x512.png',
    noindex = false,
    breadcrumbs,
    faqs,
    softwareApp,
    gscVerificationCode
  } = options;

  const fullTitle = title.includes('PDF Editfy') ? title : `${title} – PDF Editfy`;
  document.title = fullTitle;

  const setMeta = (attrName: string, attrVal: string, contentVal: string) => {
    let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentVal);
  };

  // Standard Meta Tags
  setMeta('name', 'description', description);
  setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

  // Open Graph
  setMeta('property', 'og:site_name', 'PDF Editfy');
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:type', ogType);
  setMeta('property', 'og:image', ogImage);
  setMeta('property', 'og:image:alt', 'PDF Editfy – Free Online PDF Tools');
  if (canonicalUrl) {
    setMeta('property', 'og:url', canonicalUrl);
  }

  // Twitter / X
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', fullTitle);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', ogImage);
  setMeta('name', 'twitter:image:alt', 'PDF Editfy – Free Online PDF Tools');
  if (canonicalUrl) {
    setMeta('name', 'twitter:url', canonicalUrl);
  }

  // Google Search Console verification meta if configured
  if (gscVerificationCode && gscVerificationCode.trim().length > 0) {
    setMeta('name', 'google-site-verification', gscVerificationCode.trim());
  }

  // Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonicalUrl || 'https://pdfeditfy.com/');

  // Build JSON-LD Graph
  const graph: any[] = [
    {
      '@type': 'Organization',
      '@id': 'https://pdfeditfy.com/#organization',
      'name': 'PDF Editfy',
      'url': 'https://pdfeditfy.com/',
      'logo': {
        '@type': 'ImageObject',
        '@id': 'https://pdfeditfy.com/#logo',
        'url': 'https://pdfeditfy.com/icon-512x512.png',
        'width': 512,
        'height': 512,
        'caption': 'PDF Editfy – Free Online PDF Tools'
      },
      'image': 'https://pdfeditfy.com/icon-512x512.png',
      'description': 'Fast, private, and free online PDF editor, converter, compressor, and document processing tools with zero signup required.'
    },
    {
      '@type': 'WebSite',
      '@id': 'https://pdfeditfy.com/#website',
      'url': 'https://pdfeditfy.com/',
      'name': 'PDF Editfy',
      'publisher': {
        '@id': 'https://pdfeditfy.com/#organization'
      }
    }
  ];

  // If Software Application schema is present
  if (softwareApp) {
    graph.push({
      '@type': 'WebApplication',
      '@id': `${softwareApp.url}#app`,
      'name': `${softwareApp.name} - PDF Editfy`,
      'url': softwareApp.url,
      'applicationCategory': softwareApp.category || 'UtilitiesApplication',
      'operatingSystem': 'All',
      'browserRequirements': 'Requires JavaScript and HTML5 Canvas support.',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'description': softwareApp.description,
      'publisher': {
        '@id': 'https://pdfeditfy.com/#organization'
      }
    });
  }

  // If Breadcrumbs are present
  if (breadcrumbs && breadcrumbs.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl || 'https://pdfeditfy.com/'}#breadcrumbs`,
      'itemListElement': breadcrumbs.map((b, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'name': b.name,
        'item': b.url
      }))
    });
  }

  // If FAQs are present
  if (faqs && faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl || 'https://pdfeditfy.com/'}#faq`,
      'mainEntity': faqs.map((f) => ({
        '@type': 'Question',
        'name': f.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': f.answer
        }
      }))
    });
  }

  // Inject or update Schema.org script
  let schemaScript = document.getElementById('pdfeditfy-jsonld');
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'pdfeditfy-jsonld';
    schemaScript.setAttribute('type', 'application/ld+json');
    document.head.appendChild(schemaScript);
  }

  schemaScript.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph
  }, null, 2);
}
