import { FAQItem } from '../types';

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'f1',
    category: 'General',
    question: 'Do I need to register or create an account to use pdfeditfy.com?',
    answer: 'No! pdfeditfy.com is completely free and requires zero account creation, sign-up, or email registration. You can start editing, converting, or compressing files immediately after opening the site.'
  },
  {
    id: 'f2',
    category: 'Privacy & Security',
    question: 'Are my uploaded files stored permanently on your servers?',
    answer: 'No. Your privacy and data security are our highest priorities. Most tools perform operations locally inside your web browser. Any files processed temporarily through server endpoints are automatically deleted within 15 minutes.'
  },
  {
    id: 'f3',
    category: 'File Limits',
    question: 'What is the maximum file size limit for uploads?',
    answer: 'pdfeditfy.com supports single and batch uploads up to 100MB per file, ensuring smooth performance for large presentations, high-resolution PDFs, and multidocument batches.'
  },
  {
    id: 'f4',
    category: 'Compatibility',
    question: 'Does pdfeditfy.com work on mobile phones and tablets?',
    answer: 'Yes! pdfeditfy.com is fully responsive and optimized for touch screens across smartphones (iOS & Android), tablets, laptops, and desktop computers.'
  },
  {
    id: 'f5',
    category: 'PDF Tools',
    question: 'Can I add handwritten or drawn signatures to PDF documents?',
    answer: 'Yes! Our Edit PDF tool includes a live signature pad where you can draw your signature with your mouse or finger, upload a signature graphic, or type stylized signature text, then place it anywhere on your PDF.'
  },
  {
    id: 'f6',
    category: 'Batch Tools',
    question: 'How does batch conversion and download work?',
    answer: 'You can upload multiple files simultaneously. Our converter processes each file item in parallel with progress bars and allows you to download converted files individually or together in a single ZIP archive.'
  },
  {
    id: 'f7',
    category: 'AdSense & Ads',
    question: 'Why are there unobtrusive advertisement slots on the website?',
    answer: 'Advertisements allow us to keep 100% of our file conversion and editing tools free for everyone without paywalls or mandatory subscriptions, while complying with Google AdSense quality and layout policies.'
  }
];
