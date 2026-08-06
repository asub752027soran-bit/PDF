import { ToolItem, CategoryType } from '../types';

export const TOOLS: ToolItem[] = [
  // --- PDF TOOLS ---
  {
    id: 'edit-pdf',
    name: 'Edit PDF',
    category: 'PDF Tools',
    description: 'Add text, images, shapes, highlight text, and draw or sign directly on your PDF document.',
    iconName: 'FileEdit',
    badge: 'Popular',
    supportedFormats: ['PDF'],
    tags: ['edit', 'sign', 'draw', 'text', 'highlight', 'shapes', 'signature'],
    seoTitle: 'Free Online PDF Editor - Add Text, Signatures & Shapes to PDF',
    seoDescription: 'Edit PDF files online for free. Add text, annotations, signatures, images, and shapes instantly without downloading software or creating an account.'
  },
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    category: 'PDF Tools',
    description: 'Combine multiple PDF files into one organized single document in seconds.',
    iconName: 'Combine',
    badge: 'Popular',
    supportedFormats: ['PDF'],
    tags: ['merge', 'combine', 'join', 'batch', 'append'],
    seoTitle: 'Merge PDF Files Online - 100% Free PDF Joiner',
    seoDescription: 'Combine multiple PDFs into one document easily. Reorder pages and files with drag-and-drop. Fast, free, and private.'
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    category: 'PDF Tools',
    description: 'Extract specific pages or split a large PDF into separate smaller documents.',
    iconName: 'Split',
    badge: 'Popular',
    supportedFormats: ['PDF'],
    tags: ['split', 'extract', 'separate', 'pages', 'divide'],
    seoTitle: 'Split PDF Files Online - Free PDF Page Extractor',
    seoDescription: 'Split a PDF document into independent files or extract specific page ranges for free. No signup needed.'
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    category: 'Compression Tools',
    description: 'Reduce PDF file size significantly while retaining maximum visual document quality.',
    iconName: 'FileArchive',
    badge: 'Popular',
    supportedFormats: ['PDF'],
    tags: ['compress', 'shrink', 'size', 'reduce', 'optimum'],
    seoTitle: 'Compress PDF Online - Reduce PDF File Size Free',
    seoDescription: 'Compress PDF files online to lower file size for email sharing without sacrificing resolution. Instant & private.'
  },
  {
    id: 'organize-pdf',
    name: 'Rearrange & Rotate Pages',
    category: 'PDF Tools',
    description: 'Reorder, delete, or rotate pages 90°, 180°, or 270° in any PDF file.',
    iconName: 'RotateCw',
    badge: 'Free',
    supportedFormats: ['PDF'],
    tags: ['rearrange', 'rotate', 'reorder', 'delete pages', 'orientation'],
    seoTitle: 'Rotate & Rearrange PDF Pages Free Online',
    seoDescription: 'Rotate PDF pages or reorder document pages easily with interactive drag and drop preview.'
  },
  {
    id: 'watermark-pdf',
    name: 'Watermark PDF',
    category: 'PDF Tools',
    description: 'Protect document copyrights by applying custom text or logo image watermarks.',
    iconName: 'Stamp',
    badge: 'Free',
    supportedFormats: ['PDF'],
    tags: ['watermark', 'stamp', 'copyright', 'text', 'logo'],
    seoTitle: 'Add Watermark to PDF Online Free',
    seoDescription: 'Stamp text or custom image watermarks on your PDF pages with adjustable opacity and position.'
  },
  {
    id: 'lock-pdf',
    name: 'Protect & Lock PDF',
    category: 'PDF Tools',
    description: 'Encrypt PDF documents with a strong password to prevent unauthorized access.',
    iconName: 'Lock',
    badge: 'Free',
    supportedFormats: ['PDF'],
    tags: ['lock', 'password', 'encrypt', 'security', 'protect'],
    seoTitle: 'Encrypt & Password Protect PDF Online',
    seoDescription: 'Secure your confidential PDF files with 128-bit encryption password protection online for free.'
  },
  {
    id: 'unlock-pdf',
    name: 'Unlock PDF',
    category: 'PDF Tools',
    description: 'Remove password protection and restriction locks from secured PDF files.',
    iconName: 'Unlock',
    badge: 'Free',
    supportedFormats: ['PDF'],
    tags: ['unlock', 'password removal', 'decrypt', 'remove lock'],
    seoTitle: 'Unlock PDF - Remove Password Security Online',
    seoDescription: 'Remove PDF password protection instantly to edit, print, or copy protected documents.'
  },

  // --- CONVERSION TOOLS (PDF ↔ Office & Images) ---
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    category: 'Conversion Tools',
    description: 'Convert PDF files into fully editable Microsoft Word documents (.docx or .doc).',
    iconName: 'FileText',
    badge: 'Popular',
    supportedFormats: ['PDF', 'DOCX'],
    tags: ['pdf to docx', 'pdf to word', 'convert', 'editable word'],
    seoTitle: 'Convert PDF to Word Online - Free PDF to DOCX Converter',
    seoDescription: 'Convert PDF files into editable DOCX Word files with incredible formatting retention. Fast and account-free.'
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    category: 'Conversion Tools',
    description: 'Convert Word documents (.docx, .doc, .rtf, .odt) into standard professional PDF files.',
    iconName: 'FileType2',
    badge: 'Popular',
    supportedFormats: ['DOCX', 'DOC', 'RTF', 'ODT', 'PDF'],
    tags: ['word to pdf', 'docx to pdf', 'doc converter'],
    seoTitle: 'Convert Word to PDF Free Online - DOCX to PDF',
    seoDescription: 'Convert DOCX and DOC files to high-quality PDF format in seconds.'
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    category: 'Conversion Tools',
    description: 'Extract tables and structured data from PDF into editable XLSX or CSV spreadsheets.',
    iconName: 'Table',
    badge: 'Popular',
    supportedFormats: ['PDF', 'XLSX', 'CSV'],
    tags: ['pdf to excel', 'pdf to xlsx', 'tables', 'csv'],
    seoTitle: 'Convert PDF to Excel Spreadsheet Online Free',
    seoDescription: 'Extract data tables from PDF files into Microsoft Excel spreadsheets (XLSX, CSV) seamlessly.'
  },
  {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    category: 'Conversion Tools',
    description: 'Convert Excel spreadsheets (.xlsx, .xls, .csv) into clean PDF documents.',
    iconName: 'Sheet',
    badge: 'Free',
    supportedFormats: ['XLSX', 'XLS', 'CSV', 'ODS', 'PDF'],
    tags: ['excel to pdf', 'xlsx to pdf', 'csv to pdf'],
    seoTitle: 'Convert Excel to PDF Online Free',
    seoDescription: 'Convert XLSX, XLS, and CSV files to printable, crisp PDF format.'
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    category: 'Conversion Tools',
    description: 'Convert PDF document pages into high-resolution JPG, PNG, or WEBP images.',
    iconName: 'Image',
    badge: 'Popular',
    supportedFormats: ['PDF', 'JPG', 'PNG', 'WEBP'],
    tags: ['pdf to jpg', 'pdf to png', 'extract images', 'pages to image'],
    seoTitle: 'Convert PDF to JPG / PNG Online Free',
    seoDescription: 'Extract all pages from a PDF file as individual high-resolution PNG or JPG images.'
  },
  {
    id: 'image-to-pdf',
    name: 'Images to PDF',
    category: 'Conversion Tools',
    description: 'Combine multiple JPG, PNG, WEBP, or SVG photos into a single sleek PDF file.',
    iconName: 'Images',
    badge: 'Popular',
    supportedFormats: ['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG', 'BMP', 'TIFF', 'PDF'],
    tags: ['jpg to pdf', 'png to pdf', 'photos to pdf', 'convert images'],
    seoTitle: 'Convert JPG & PNG Images to PDF Online Free',
    seoDescription: 'Convert image files into PDF format. Adjust orientation, margins, and page sizes easily.'
  },
  {
    id: 'ppt-to-pdf',
    name: 'PowerPoint to PDF',
    category: 'PowerPoint Tools',
    description: 'Convert PPT and PPTX slides into easily viewable PDF slideshows.',
    iconName: 'Presentation',
    badge: 'Free',
    supportedFormats: ['PPT', 'PPTX', 'ODP', 'PDF'],
    tags: ['ppt to pdf', 'pptx to pdf', 'slides to pdf'],
    seoTitle: 'Convert PowerPoint PPT to PDF Free Online',
    seoDescription: 'Turn PPT and PPTX presentations into PDF files for easy sharing on any device.'
  },

  // --- WORD & OFFICE TOOLS ---
  {
    id: 'edit-word',
    name: 'Edit & View Word Docs',
    category: 'Word Tools',
    description: 'Preview DOCX text content, edit online, and export to TXT, PDF, or updated Word file.',
    iconName: 'FileCheck',
    badge: 'New',
    supportedFormats: ['DOCX', 'DOC', 'TXT'],
    tags: ['edit docx', 'word viewer', 'text editor', 'doc editor'],
    seoTitle: 'Free Online Word Document Editor & Viewer',
    seoDescription: 'Read and edit DOCX files directly in your web browser. Save modifications instantly.'
  },
  {
    id: 'word-to-txt',
    name: 'Word to TXT',
    category: 'Word Tools',
    description: 'Extract pure text content from DOC and DOCX files into clean plain text files.',
    iconName: 'FileCode',
    badge: 'Free',
    supportedFormats: ['DOCX', 'DOC', 'TXT'],
    tags: ['word to txt', 'docx to text', 'extract text'],
    seoTitle: 'Convert Word DOCX to Plain Text TXT Online',
    seoDescription: 'Extract readable plain text from Word files quickly and easily.'
  },

  // --- EXCEL & SPREADSHEET TOOLS ---
  {
    id: 'edit-excel',
    name: 'Edit & View Excel Grid',
    category: 'Excel Tools',
    description: 'View spreadsheet sheets, edit table cells, search data, and export clean XLSX/CSV.',
    iconName: 'Grid',
    badge: 'New',
    supportedFormats: ['XLSX', 'XLS', 'CSV'],
    tags: ['excel editor', 'csv viewer', 'spreadsheet viewer', 'table edit'],
    seoTitle: 'Free Online Excel & CSV Spreadsheet Editor',
    seoDescription: 'Open, inspect, edit, and export XLSX and CSV spreadsheet files online without Microsoft Office.'
  },
  {
    id: 'csv-excel-converter',
    name: 'CSV ↔ Excel Converter',
    category: 'Excel Tools',
    description: 'Convert CSV to XLSX format or convert XLSX sheets to lightweight CSV files.',
    iconName: 'ArrowLeftRight',
    badge: 'Free',
    supportedFormats: ['CSV', 'XLSX', 'XLS'],
    tags: ['csv to excel', 'excel to csv', 'format conversion'],
    seoTitle: 'Convert CSV to Excel & Excel to CSV Free',
    seoDescription: 'Seamlessly convert between CSV and Excel formats with UTF-8 character encoding support.'
  },

  // --- IMAGE TOOLS ---
  {
    id: 'image-converter',
    name: 'Universal Image Converter',
    category: 'Image Tools',
    description: 'Convert between JPG, PNG, WEBP, SVG, GIF, BMP, and TIFF formats instantly.',
    iconName: 'ImagePlus',
    badge: 'Popular',
    supportedFormats: ['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG', 'GIF', 'BMP', 'TIFF'],
    tags: ['jpg to png', 'png to webp', 'svg converter', 'image format'],
    seoTitle: 'Universal Image Converter - JPG, PNG, WEBP, SVG',
    seoDescription: 'Convert images to any format: JPG to PNG, PNG to WEBP, SVG to JPG, BMP, TIFF and more.'
  },
  {
    id: 'image-compressor',
    name: 'Compress Images',
    category: 'Compression Tools',
    description: 'Compress JPG, PNG, WEBP images with custom quality slider and side-by-side preview.',
    iconName: 'Minimize2',
    badge: 'Popular',
    supportedFormats: ['JPG', 'JPEG', 'PNG', 'WEBP'],
    tags: ['compress image', 'reduce image size', 'shrink jpg', 'optimize png'],
    seoTitle: 'Compress Images Online - Reduce JPG & PNG Size',
    seoDescription: 'Lossless & lossy image compression tool. Shrink image file size up to 80% without quality loss.'
  },
  {
    id: 'image-resizer',
    name: 'Resize & Crop Images',
    category: 'Image Tools',
    description: 'Adjust image width, height, aspect ratio, crop custom regions, and rotate photos.',
    iconName: 'Crop',
    badge: 'Free',
    supportedFormats: ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'BMP'],
    tags: ['resize image', 'crop photo', 'flip image', 'dimensions'],
    seoTitle: 'Resize & Crop Images Online Free',
    seoDescription: 'Resize photos by pixels or percentage, crop exact aspect ratios, and mirror/rotate images.'
  },

  // --- OCR & ADVANCED TOOLS ---
  {
    id: 'ocr-reader',
    name: 'OCR Image & PDF Text Reader',
    category: 'PDF Tools',
    description: 'Extract editable text from scanned documents, PDF pages, or camera pictures.',
    iconName: 'ScanText',
    badge: 'New',
    supportedFormats: ['PDF', 'JPG', 'PNG', 'WEBP', 'BMP'],
    tags: ['ocr', 'text recognition', 'scanned pdf', 'extract text from image'],
    seoTitle: 'Free Online OCR Tool - Extract Text from Images & PDF',
    seoDescription: 'Run Optical Character Recognition on scanned PDF documents or images to get editable text.'
  },
  {
    id: 'universal-converter',
    name: 'Batch Universal Converter',
    category: 'Conversion Tools',
    description: 'Upload multiple files of any supported format and convert or compress in bulk.',
    iconName: 'Layers',
    badge: 'Batch',
    supportedFormats: ['PDF', 'DOCX', 'XLSX', 'PPTX', 'JPG', 'PNG', 'WEBP', 'CSV', 'TXT'],
    tags: ['batch convert', 'bulk converter', 'multi-file', 'zip download'],
    seoTitle: 'Batch File Converter - Convert Multiple Files Online',
    seoDescription: 'Batch process multiple document and image files at once with instant ZIP file archive download.'
  }
];

export const CATEGORIES: CategoryType[] = [
  'All',
  'PDF Tools',
  'Word Tools',
  'Excel Tools',
  'PowerPoint Tools',
  'Image Tools',
  'Compression Tools',
  'Conversion Tools'
];
