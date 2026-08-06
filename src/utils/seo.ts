export function updateSEOMeta(
  title: string,
  description: string,
  canonicalUrl?: string,
  ogType: string = 'website'
) {
  // Update document title
  document.title = `${title} | PDFEditfy Free Online File Tools`;

  // Helper to update or create meta tag
  const setMetaTag = (nameAttr: string, attrVal: string, contentVal: string) => {
    let element = document.querySelector(`meta[${nameAttr}="${attrVal}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(nameAttr, attrVal);
      document.head.appendChild(element);
    }
    element.setAttribute('content', contentVal);
  };

  setMetaTag('name', 'description', description);
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:type', ogType);
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);

  // Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl || window.location.href);

  // JSON-LD Schema.org Structured Data
  let schemaScript = document.getElementById('pdfeditfy-jsonld');
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'pdfeditfy-jsonld';
    schemaScript.setAttribute('type', 'application/ld+json');
    document.head.appendChild(schemaScript);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'PDFEditfy',
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'All',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    },
    'description': description,
    'browserRequirements': 'Requires JavaScript and modern web browser.'
  };

  schemaScript.textContent = JSON.stringify(structuredData);
}
