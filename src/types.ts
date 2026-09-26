export type CategoryType =
  | 'All'
  | 'PDF Tools'
  | 'Word Tools'
  | 'Excel Tools'
  | 'PowerPoint Tools'
  | 'Image Tools'
  | 'Compression Tools'
  | 'Conversion Tools';

export interface ToolItem {
  id: string;
  name: string;
  category: CategoryType;
  description: string;
  iconName: string; // Lucide icon name string
  badge?: 'Popular' | 'New' | 'Batch' | 'Free';
  supportedFormats: string[];
  tags: string[];
  seoTitle: string;
  seoDescription: string;
}

export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  status: ProcessingStatus;
  progress: number;
  resultUrl?: string;
  resultBlob?: Blob;
  resultName?: string;
  resultSize?: number;
  error?: string;
  previewUrl?: string;
}

export interface PDFAnnotation {
  id: string;
  pageNumber: number; // 1-indexed
  type: 'text' | 'draw' | 'shape' | 'signature' | 'highlight' | 'image' | 'whiteout' | 'redact' | 'stamp';
  x: number; // percentage (0-100) or px
  y: number; // percentage (0-100) or px
  width?: number;
  height?: number;
  content?: string; // Text content or Image Data URL
  color?: string;
  fillColor?: string;
  fontSize?: number;
  fontFamily?: string;
  strokeWidth?: number;
  opacity?: number;
  isBold?: boolean;
  isItalic?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  hasWhiteoutBg?: boolean;
  stampType?: string;
  shapeType?: 'rectangle' | 'circle' | 'arrow' | 'line';
  points?: { x: number; y: number }[]; // For freehand draw
}

export interface EditablePdfText {
  id: string;
  pageNumber: number;
  originalText: string;
  currentText: string;
  x: number; // percentage (0-100) from left
  y: number; // percentage (0-100) from top
  width: number; // percentage (0-100) width
  height: number; // percentage (0-100) height
  fontSize: number; // pt size
  fontFamily: string;
  fontName?: string;
  pdfFontType?: 'serif' | 'sans-serif' | 'monospace' | string;
  isBold?: boolean;
  isItalic?: boolean;
  color?: string;
  isModified: boolean;
  isDeleted?: boolean;
}

export interface PDFPageInfo {
  pageIndex: number;
  rotation: number; // 0, 90, 180, 270
  selected: boolean;
  thumbnailUrl?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  publishedDate: string;
  author: string;
  content: string;
  tags: string[];
}

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface ToolSeoConfig {
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  canonicalUrl?: string;
  ogImage?: string;
  indexable?: boolean;
}

export interface AdminConfig {
  siteName: string;
  announcementBar: {
    enabled: boolean;
    text: string;
    linkText?: string;
    type: 'info' | 'warning' | 'success';
  };
  maintenanceMode: boolean;
  adsensePublisherId: string;
  adsEnabled: boolean;
  disabledTools: string[];
  customBadges: Record<string, 'Popular' | 'New' | 'Batch' | 'Free' | 'Pro' | 'Beta'>;
  adminPasscode: string;
  analyticsEnabled: boolean;
  gaTrackingId: string;
  maxUploadSizeMB: number;
  // AdSense Tool Page Slot Placement Controls
  toolAdSlotType?: 'leaderboard' | 'banner' | 'sidebar';
  toolAdSlots?: {
    leaderboard: boolean;
    banner: boolean;
    sidebar: boolean;
  };
  adsenseCustomSlots?: {
    leaderboard?: string;
    banner?: string;
    sidebar?: string;
  };
  // Comprehensive SEO Settings
  homepageSeoTitle?: string;
  homepageSeoDescription?: string;
  gscVerificationCode?: string;
  canonicalBaseUrl?: string;
  ogImage?: string;
  toolSeoOverrides?: Record<string, ToolSeoConfig>;
  // Custom Self-Served Advertisements & Direct Sponsors
  adServingMode?: 'hybrid' | 'adsense_only' | 'custom_only' | 'fallback';
  customAds?: CustomAdItem[];
}

export type AdSlotType = 'leaderboard' | 'banner' | 'sidebar' | 'homepage_top' | 'homepage_bottom' | 'rectangle';

export interface CustomAdItem {
  id: string;
  title: string;
  description?: string;
  sponsorName?: string;
  targetUrl: string;
  imageUrl?: string;
  adType: 'card' | 'image' | 'custom_html' | 'script';
  htmlContent?: string;
  scriptCode?: string;
  ctaText?: string;
  badgeText?: string; // e.g. "Sponsored", "Special Deal", "Featured Partner", "Affiliate"
  slots: AdSlotType[];
  targetTools?: string[]; // 'all' or list of tool IDs
  enabled: boolean;
  impressions: number;
  clicks: number;
  bgGradient?: 'blue' | 'purple' | 'emerald' | 'amber' | 'dark' | 'rose' | 'slate';
  createdAt: string;
}

export interface ContactInquiry {
  id: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'unread' | 'read' | 'replied';
}

export interface ActionLogEntry {
  id: string;
  timestamp: number;
  toolId: string;
  toolName: string;
  category: string;
  action: string;
  fileSizeBytes: number;
  formattedSize: string;
  status: 'success' | 'failed';
  details?: string;
}
