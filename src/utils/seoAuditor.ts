import { TOOLS } from '../data/toolsData';
import { TOOL_SEO_DETAILS } from '../data/toolSeoData';
import { AdminConfig } from '../types';

export type IssueSeverity = 'error' | 'warning' | 'info' | 'pass';
export type IssueCategory = 'canonical' | 'meta_description' | 'title' | 'json_ld' | 'robots' | 'social' | 'content';

export interface SeoAuditIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  recommendation: string;
  currentValue?: string;
  suggestedValue?: string;
  fieldToFix?: 'seoTitle' | 'seoDescription' | 'canonicalUrl' | 'homepageSeoTitle' | 'homepageSeoDescription';
}

export interface PageAuditResult {
  id: string;
  pageType: 'homepage' | 'tool' | 'page';
  name: string;
  url: string;
  relativeUrl: string;
  toolId?: string;
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  jsonLdRaw: string;
  jsonLdParsed: any;
  jsonLdValid: boolean;
  jsonLdErrors: string[];
  schemaTypes: string[];
  issues: SeoAuditIssue[];
  score: number;
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  checksPassed: number;
  checksFailed: number;
  checksWarned: number;
  h1?: string;
  faqCount?: number;
  howToStepsCount?: number;
}

export interface FullAuditReport {
  timestamp: string;
  totalScore: number;
  totalPages: number;
  totalErrors: number;
  totalWarnings: number;
  totalPassed: number;
  pages: PageAuditResult[];
  summary: {
    canonicalIssuesCount: number;
    metaDescriptionIssuesCount: number;
    titleIssuesCount: number;
    jsonLdIssuesCount: number;
    robotsIssuesCount: number;
  };
}

const STATIC_PAGES = [
  {
    id: 'about',
    name: 'About Us',
    url: 'https://pdfeditfy.com/about',
    relativeUrl: '/about',
    title: 'About Us – PDF Editfy',
    description: 'Learn about PDF Editfy, our mission to provide free, private, and secure online document and PDF tools for everyone without sign-up.',
  },
  {
    id: 'contact',
    name: 'Contact Support',
    url: 'https://pdfeditfy.com/contact',
    relativeUrl: '/contact',
    title: 'Contact Support – PDF Editfy',
    description: 'Contact the PDF Editfy team with support questions, inquiries, or feedback.',
  },
  {
    id: 'privacy',
    name: 'Privacy Policy',
    url: 'https://pdfeditfy.com/privacy',
    relativeUrl: '/privacy',
    title: 'Privacy Policy – PDF Editfy',
    description: 'PDF Editfy privacy policy, zero data retention guarantee, and client-side processing details.',
  },
  {
    id: 'terms',
    name: 'Terms of Service',
    url: 'https://pdfeditfy.com/terms',
    relativeUrl: '/terms',
    title: 'Terms of Service – PDF Editfy',
    description: 'Terms of service and acceptable use agreement for PDF Editfy tools.',
  },
  {
    id: 'disclaimer',
    name: 'Disclaimer',
    url: 'https://pdfeditfy.com/disclaimer',
    relativeUrl: '/disclaimer',
    title: 'Disclaimer – PDF Editfy',
    description: 'Legal disclaimer and service availability guidelines for PDF Editfy online platform.',
  },
  {
    id: 'faq',
    name: 'Frequently Asked Questions',
    url: 'https://pdfeditfy.com/faq',
    relativeUrl: '/faq',
    title: 'Frequently Asked Questions – PDF Editfy',
    description: 'Answers to frequently asked questions about PDF Editfy features, tools, conversions, and security.',
  },
  {
    id: 'blog',
    name: 'Knowledge Hub & Guides',
    url: 'https://pdfeditfy.com/blog',
    relativeUrl: '/blog',
    title: 'PDF & Document Guides – PDF Editfy Knowledge Hub',
    description: 'Helpful tutorials, guides, and best practices for PDF editing, conversion, compression, and document workflow efficiency.',
  }
];

/**
 * Builds the simulated JSON-LD graph for a given page
 */
export function generateSimulatedJsonLd(
  pageType: 'homepage' | 'tool' | 'page',
  canonicalUrl: string,
  toolInfo?: { name: string; description: string; category: string; toolId: string }
): { raw: string; parsed: any; valid: boolean; errors: string[]; schemaTypes: string[] } {
  try {
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

    if (pageType === 'tool' && toolInfo) {
      graph.push({
        '@type': 'WebApplication',
        '@id': `${canonicalUrl}#app`,
        'name': `${toolInfo.name} - PDF Editfy`,
        'url': canonicalUrl,
        'applicationCategory': 'UtilitiesApplication',
        'operatingSystem': 'All',
        'browserRequirements': 'Requires JavaScript and HTML5 Canvas support.',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'description': toolInfo.description,
        'publisher': {
          '@id': 'https://pdfeditfy.com/#organization'
        }
      });

      graph.push({
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumbs`,
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://pdfeditfy.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': toolInfo.category, 'item': `https://pdfeditfy.com/#${toolInfo.category}` },
          { '@type': 'ListItem', 'position': 3, 'name': toolInfo.name, 'item': canonicalUrl }
        ]
      });

      const seoDetail = TOOL_SEO_DETAILS[toolInfo.toolId];
      if (seoDetail?.faqs && seoDetail.faqs.length > 0) {
        graph.push({
          '@type': 'FAQPage',
          '@id': `${canonicalUrl}#faq`,
          'mainEntity': seoDetail.faqs.map((f) => ({
            '@type': 'Question',
            'name': f.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': f.answer
            }
          }))
        });
      }
    }

    const payload = {
      '@context': 'https://schema.org',
      '@graph': graph
    };

    const raw = JSON.stringify(payload, null, 2);
    const schemaTypes = graph.map((item) => item['@type']).filter(Boolean);

    return {
      raw,
      parsed: payload,
      valid: true,
      errors: [],
      schemaTypes
    };
  } catch (err: any) {
    return {
      raw: '',
      parsed: null,
      valid: false,
      errors: [err.message || 'JSON-LD schema serialization failed'],
      schemaTypes: []
    };
  }
}

/**
 * Validates a page's SEO elements and returns actionable audit issues and scores
 */
export function auditSinglePage(
  pageType: 'homepage' | 'tool' | 'page',
  pageId: string,
  name: string,
  url: string,
  relativeUrl: string,
  rawTitle: string,
  rawDescription: string,
  canonicalUrl: string,
  isNoIndex: boolean,
  adminConfig: AdminConfig,
  toolId?: string
): PageAuditResult {
  const issues: SeoAuditIssue[] = [];

  // Normalize Title
  const title = rawTitle.includes('PDF Editfy') ? rawTitle : `${rawTitle} – PDF Editfy`;
  const description = rawDescription.trim();
  const robots = isNoIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  // 1. Title Tag Audit
  if (!title || title.trim().length === 0) {
    issues.push({
      id: `${pageId}-title-missing`,
      severity: 'error',
      category: 'title',
      title: 'Missing Title Tag',
      description: 'The page has an empty or missing <title> tag. Search engines require a descriptive title tag for indexing and search snippet rendering.',
      recommendation: 'Add a distinct, keyword-rich title between 35 and 60 characters.',
      fieldToFix: pageType === 'homepage' ? 'homepageSeoTitle' : 'seoTitle'
    });
  } else {
    const titleLen = title.length;
    if (titleLen < 25) {
      issues.push({
        id: `${pageId}-title-short`,
        severity: 'warning',
        category: 'title',
        title: 'Title Tag is Too Short',
        description: `Title is only ${titleLen} characters long. Short titles miss valuable primary and secondary keyword opportunities.`,
        recommendation: 'Expand the title to 45–60 characters by including tool features or use cases (e.g. "Free Online PDF Editor – Annotate & Sign PDF").',
        currentValue: title,
        fieldToFix: pageType === 'homepage' ? 'homepageSeoTitle' : 'seoTitle'
      });
    } else if (titleLen > 70) {
      issues.push({
        id: `${pageId}-title-long`,
        severity: 'warning',
        category: 'title',
        title: 'Title Tag May Be Truncated in SERP',
        description: `Title is ${titleLen} characters long. Google typically truncates search titles after 60–65 characters (~600px pixel width).`,
        recommendation: 'Condense the title to under 60 characters so users see the complete headline in search results.',
        currentValue: title,
        fieldToFix: pageType === 'homepage' ? 'homepageSeoTitle' : 'seoTitle'
      });
    } else {
      issues.push({
        id: `${pageId}-title-pass`,
        severity: 'pass',
        category: 'title',
        title: 'Title Tag is Optimized',
        description: `Title is ${titleLen} characters long, within the optimal 35–65 character range with proper branding.`,
        recommendation: 'No changes required.',
        currentValue: title
      });
    }
  }

  // 2. Meta Description Audit
  if (!description || description.length === 0) {
    issues.push({
      id: `${pageId}-desc-missing`,
      severity: 'error',
      category: 'meta_description',
      title: 'Missing Meta Description',
      description: 'The <meta name="description"> tag is empty or missing. Google will auto-generate search snippets from page text if absent, leading to suboptimal click-through rates.',
      recommendation: 'Add a compelling meta description between 120 and 160 characters describing tool functionality and privacy benefits.',
      fieldToFix: pageType === 'homepage' ? 'homepageSeoDescription' : 'seoDescription'
    });
  } else {
    const descLen = description.length;
    if (descLen < 80) {
      issues.push({
        id: `${pageId}-desc-short`,
        severity: 'warning',
        category: 'meta_description',
        title: 'Meta Description is Too Short',
        description: `Meta description is only ${descLen} characters long. Search snippet displays typically accommodate 120–160 characters.`,
        recommendation: 'Expand the description to 120–160 characters with clear call-to-actions and feature highlights.',
        currentValue: description,
        fieldToFix: pageType === 'homepage' ? 'homepageSeoDescription' : 'seoDescription'
      });
    } else if (descLen > 165) {
      issues.push({
        id: `${pageId}-desc-long`,
        severity: 'warning',
        category: 'meta_description',
        title: 'Meta Description Exceeds Recommended Length',
        description: `Meta description is ${descLen} characters long and may get truncated with an ellipsis (...) in Google search snippets.`,
        recommendation: 'Trim the description to 140–160 characters to ensure the full sentence is readable in desktop and mobile SERPs.',
        currentValue: description,
        fieldToFix: pageType === 'homepage' ? 'homepageSeoDescription' : 'seoDescription'
      });
    } else {
      issues.push({
        id: `${pageId}-desc-pass`,
        severity: 'pass',
        category: 'meta_description',
        title: 'Meta Description is Well-Optimized',
        description: `Meta description length is ${descLen} characters (ideal range: 120–160 chars) with strong conversion messaging.`,
        recommendation: 'No changes required.',
        currentValue: description
      });
    }
  }

  // 3. Canonical Tag Audit
  if (!canonicalUrl || canonicalUrl.trim().length === 0) {
    issues.push({
      id: `${pageId}-canonical-missing`,
      severity: 'error',
      category: 'canonical',
      title: 'Missing Canonical Tag',
      description: 'The <link rel="canonical"> tag is absent. Canonical tags are critical to prevent duplicate content penalties across query parameters and alternate URLs.',
      recommendation: `Set a self-referential canonical tag pointing to ${url}.`,
      suggestedValue: url
    });
  } else if (!canonicalUrl.startsWith('https://')) {
    issues.push({
      id: `${pageId}-canonical-insecure`,
      severity: 'error',
      category: 'canonical',
      title: 'Insecure or Relative Canonical URL',
      description: `Canonical URL "${canonicalUrl}" does not use absolute HTTPS protocol. Google requires absolute canonical URLs.`,
      recommendation: `Change canonical URL to use absolute HTTPS: ${url}.`,
      currentValue: canonicalUrl,
      suggestedValue: url
    });
  } else if (canonicalUrl !== url && !canonicalUrl.includes('pdfeditfy.com')) {
    issues.push({
      id: `${pageId}-canonical-mismatch`,
      severity: 'warning',
      category: 'canonical',
      title: 'Canonical URL Target Mismatch',
      description: `The canonical URL "${canonicalUrl}" differs from expected URL "${url}". Verify this is intentional for duplicate consolidation.`,
      recommendation: `Update canonical URL to target ${url} unless consolidating parameters.`,
      currentValue: canonicalUrl,
      suggestedValue: url
    });
  } else {
    issues.push({
      id: `${pageId}-canonical-pass`,
      severity: 'pass',
      category: 'canonical',
      title: 'Canonical Tag is Valid & Verified',
      description: `Absolute HTTPS canonical tag is present and properly self-referential: ${canonicalUrl}.`,
      recommendation: 'No changes required.',
      currentValue: canonicalUrl
    });
  }

  // 4. JSON-LD Schema.org Audit
  let toolInfo;
  if (pageType === 'tool' && toolId) {
    const tool = TOOLS.find((t) => t.id === toolId);
    if (tool) {
      toolInfo = {
        name: tool.name,
        description: description,
        category: tool.category,
        toolId: tool.id
      };
    }
  }

  const jsonLdResult = generateSimulatedJsonLd(pageType, canonicalUrl, toolInfo);

  if (!jsonLdResult.valid || jsonLdResult.errors.length > 0) {
    issues.push({
      id: `${pageId}-jsonld-invalid`,
      severity: 'error',
      category: 'json_ld',
      title: 'Invalid JSON-LD Structured Data',
      description: `JSON-LD schema contains syntax or serialization errors: ${jsonLdResult.errors.join(', ')}.`,
      recommendation: 'Fix the JSON-LD schema syntax to comply with Schema.org standards.'
    });
  } else {
    const types = jsonLdResult.schemaTypes;

    // Check essential schema types
    if (!types.includes('Organization')) {
      issues.push({
        id: `${pageId}-jsonld-missing-org`,
        severity: 'warning',
        category: 'json_ld',
        title: 'Missing Organization Schema',
        description: 'Google recommends Organization schema with logo and publisher details for brand knowledge panels.',
        recommendation: 'Include Organization schema with site logo and name.'
      });
    }

    if (!types.includes('WebSite')) {
      issues.push({
        id: `${pageId}-jsonld-missing-website`,
        severity: 'warning',
        category: 'json_ld',
        title: 'Missing WebSite Schema',
        description: 'WebSite schema enhances sitename and sitelinks search box rich results in Google.',
        recommendation: 'Include WebSite structured data pointing to root URL.'
      });
    }

    if (pageType === 'tool') {
      if (!types.includes('WebApplication')) {
        issues.push({
          id: `${pageId}-jsonld-missing-webapp`,
          severity: 'error',
          category: 'json_ld',
          title: 'Missing WebApplication Schema on Tool Page',
          description: 'Tool pages require WebApplication structured data to qualify for Google software application rich snippets.',
          recommendation: 'Add WebApplication schema with operatingSystem, applicationCategory, and free offers.'
        });
      }

      if (!types.includes('BreadcrumbList')) {
        issues.push({
          id: `${pageId}-jsonld-missing-breadcrumbs`,
          severity: 'warning',
          category: 'json_ld',
          title: 'Missing BreadcrumbList Schema',
          description: 'BreadcrumbList schema enables Google to display hierarchical navigational breadcrumbs in search snippets.',
          recommendation: 'Include BreadcrumbList with Home > Category > Tool hierarchy.'
        });
      }

      const seoDetail = toolId ? TOOL_SEO_DETAILS[toolId] : null;
      if (seoDetail?.faqs && seoDetail.faqs.length > 0) {
        if (!types.includes('FAQPage')) {
          issues.push({
            id: `${pageId}-jsonld-missing-faq`,
            severity: 'warning',
            category: 'json_ld',
            title: 'FAQ Content Present but Missing FAQPage Schema',
            description: 'Page includes FAQs but FAQPage structured data is not active. Adding FAQPage schema qualifies the page for expandable FAQ rich results in Google.',
            recommendation: 'Inject FAQPage JSON-LD schema with question/answer pairs.'
          });
        }
      }
    }

    // If no errors were logged for JSON-LD, log a pass
    if (!issues.some((i) => i.category === 'json_ld' && i.severity === 'error')) {
      issues.push({
        id: `${pageId}-jsonld-pass`,
        severity: 'pass',
        category: 'json_ld',
        title: 'JSON-LD Structured Data Validated',
        description: `Valid Schema.org markup detected with ${types.length} structured types (${types.join(', ')}).`,
        recommendation: 'No changes required.'
      });
    }
  }

  // 5. Robots & Indexability Check
  if (isNoIndex) {
    issues.push({
      id: `${pageId}-robots-noindex`,
      severity: 'warning',
      category: 'robots',
      title: 'Page Marked as NoIndex',
      description: 'This page currently outputs <meta name="robots" content="noindex, nofollow" /> and will not appear in Google Search results.',
      recommendation: 'If this tool or page should receive organic Google traffic, re-enable "Indexable in Google" in Tool SEO Controls.',
      currentValue: robots
    });
  } else {
    issues.push({
      id: `${pageId}-robots-pass`,
      severity: 'pass',
      category: 'robots',
      title: 'Indexable by Search Crawlers',
      description: 'Robots meta tag permits full search indexation, snippet extraction, and rich image previews.',
      recommendation: 'No changes required.',
      currentValue: robots
    });
  }

  // 6. Content & Rich Details Audit (for tool pages)
  let h1Text;
  let faqCount = 0;
  let howToStepsCount = 0;

  if (pageType === 'tool' && toolId) {
    const seoDetail = TOOL_SEO_DETAILS[toolId];
    if (seoDetail) {
      h1Text = seoDetail.h1;
      faqCount = seoDetail.faqs?.length || 0;
      howToStepsCount = seoDetail.howToSteps?.length || 0;

      if (!seoDetail.h1 || seoDetail.h1.trim().length === 0) {
        issues.push({
          id: `${pageId}-h1-missing`,
          severity: 'error',
          category: 'content',
          title: 'Missing Main H1 Heading',
          description: 'H1 header is missing in SEO definitions. The H1 heading is the primary topical indicator for Googlebot.',
          recommendation: 'Define a distinct, keyword-focused H1 heading.'
        });
      }

      if (howToStepsCount < 3) {
        issues.push({
          id: `${pageId}-howto-sparse`,
          severity: 'warning',
          category: 'content',
          title: 'How-To Guide Has Few Steps',
          description: `Only ${howToStepsCount} step(s) found in how-to guide. In-depth instructions improve search quality and dwell time.`,
          recommendation: 'Expand how-to instructions to 3-4 structured, actionable steps.'
        });
      }

      if (faqCount < 2) {
        issues.push({
          id: `${pageId}-faq-sparse`,
          severity: 'warning',
          category: 'content',
          title: 'Few or No FAQ Items',
          description: 'Page has fewer than 2 FAQ questions. FAQs improve conversational search rankings (Google AI Overviews).',
          recommendation: 'Add 3–4 common user questions and detailed answers.'
        });
      }
    }
  }

  // Calculate Page Score (0 to 100)
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const passes = issues.filter((i) => i.severity === 'pass');

  // Scoring math: Start at 100. Deduct 25 for each error, 8 for each warning. Min 0.
  let score = 100 - (errors.length * 25) - (warnings.length * 8);
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  let status: 'excellent' | 'good' | 'needs_attention' | 'critical' = 'excellent';
  if (errors.length > 0) {
    status = errors.length >= 2 ? 'critical' : 'needs_attention';
  } else if (warnings.length > 1) {
    status = 'needs_attention';
  } else if (warnings.length === 1) {
    status = 'good';
  }

  return {
    id: pageId,
    pageType,
    name,
    url,
    relativeUrl,
    toolId,
    title,
    description,
    canonicalUrl,
    robots,
    jsonLdRaw: jsonLdResult.raw,
    jsonLdParsed: jsonLdResult.parsed,
    jsonLdValid: jsonLdResult.valid,
    jsonLdErrors: jsonLdResult.errors,
    schemaTypes: jsonLdResult.schemaTypes,
    issues,
    score,
    status,
    checksPassed: passes.length,
    checksFailed: errors.length,
    checksWarned: warnings.length,
    h1: h1Text,
    faqCount,
    howToStepsCount
  };
}

/**
 * Runs the comprehensive audit across Homepage, all 26+ Tool pages, and Static Hub pages.
 */
export function runFullSeoAudit(adminConfig: AdminConfig): FullAuditReport {
  const pages: PageAuditResult[] = [];

  // 1. Audit Homepage
  const hpTitle = adminConfig.homepageSeoTitle || 'PDF Editfy – Free Online PDF Editor, Converter & Compressor';
  const hpDesc = adminConfig.homepageSeoDescription || 'Edit, convert, compress, merge, split and manage PDF files online with PDF Editfy. Fast, easy and free online PDF tools.';
  const hpCanonical = 'https://pdfeditfy.com/';

  pages.push(
    auditSinglePage(
      'homepage',
      'homepage',
      'Homepage / Main Hub',
      'https://pdfeditfy.com/',
      '/',
      hpTitle,
      hpDesc,
      hpCanonical,
      false,
      adminConfig
    )
  );

  // 2. Audit All Tool Pages
  for (const tool of TOOLS) {
    const seoDetail = TOOL_SEO_DETAILS[tool.id];
    const customOverride = (adminConfig.toolSeoOverrides || {})[tool.id] || {};

    const title = customOverride.seoTitle || tool.seoTitle || `${tool.name} – Free Online Tool`;
    const description = customOverride.seoDescription || tool.seoDescription || seoDetail?.shortIntro || tool.description;
    const canonicalUrl = `https://pdfeditfy.com/tool/${tool.id}`;
    const isNoIndex = customOverride.indexable === false;

    pages.push(
      auditSinglePage(
        'tool',
        `tool-${tool.id}`,
        tool.name,
        canonicalUrl,
        `/tool/${tool.id}`,
        title,
        description,
        canonicalUrl,
        isNoIndex,
        adminConfig,
        tool.id
      )
    );
  }

  // 3. Audit Static Hub & Legal Pages
  for (const sp of STATIC_PAGES) {
    pages.push(
      auditSinglePage(
        'page',
        `page-${sp.id}`,
        sp.name,
        sp.url,
        sp.relativeUrl,
        sp.title,
        sp.description,
        sp.url,
        false,
        adminConfig
      )
    );
  }

  // Compute Global Aggregates
  let totalScoreSum = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalPassed = 0;

  let canonicalIssuesCount = 0;
  let metaDescriptionIssuesCount = 0;
  let titleIssuesCount = 0;
  let jsonLdIssuesCount = 0;
  let robotsIssuesCount = 0;

  for (const p of pages) {
    totalScoreSum += p.score;
    totalErrors += p.checksFailed;
    totalWarnings += p.checksWarned;
    totalPassed += p.checksPassed;

    for (const issue of p.issues) {
      if (issue.severity === 'error' || issue.severity === 'warning') {
        if (issue.category === 'canonical') canonicalIssuesCount++;
        if (issue.category === 'meta_description') metaDescriptionIssuesCount++;
        if (issue.category === 'title') titleIssuesCount++;
        if (issue.category === 'json_ld') jsonLdIssuesCount++;
        if (issue.category === 'robots') robotsIssuesCount++;
      }
    }
  }

  const averageScore = Math.round(totalScoreSum / (pages.length || 1));

  return {
    timestamp: new Date().toISOString(),
    totalScore: averageScore,
    totalPages: pages.length,
    totalErrors,
    totalWarnings,
    totalPassed,
    pages,
    summary: {
      canonicalIssuesCount,
      metaDescriptionIssuesCount,
      titleIssuesCount,
      jsonLdIssuesCount,
      robotsIssuesCount
    }
  };
}
