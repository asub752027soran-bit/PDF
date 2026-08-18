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
  strokeWidth?: number;
  opacity?: number;
  isBold?: boolean;
  shapeType?: 'rectangle' | 'circle' | 'arrow' | 'line';
  points?: { x: number; y: number }[]; // For freehand draw
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
}

export interface ContactInquiry {
  id: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'unread' | 'read' | 'replied';
}
