import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Layers,
  Lock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { BLOG_POSTS } from '../data/blogData';

interface HomeEditorialSectionProps {
  onSelectTool: (toolId: string) => void;
  onOpenPage: (pageName: string) => void;
  onOpenBlogPost?: (slug: string) => void;
}

const HOMEPAGE_FAQS = [
  {
    question: 'Are my PDFs, Office files, or images uploaded and stored on external servers?',
    answer:
      'No. PDF Editfy executes PDF editing, page merging, splitting, compression, OCR reading, image enhancement, and invoice generation inside your local browser memory using HTML5 Canvas and WebAssembly libraries. Only when you explicitly create a hosted short image link does an encrypted asset expire automatically.',
  },
  {
    question: 'Is PDF Editfy completely free without account registration or watermarks?',
    answer:
      'Yes. All document and image utilities on PDF Editfy are completely free to use with no sign-up, no email verification, and no forced watermarks on downloaded exports.',
  },
  {
    question: 'How are the tools ordered in the main workspace?',
    answer:
      'Tools automatically arrange by actual usage count so your most frequently used PDF, conversion, and image tools stay right at the top. You can also switch between Most Used, Category Order, and A–Z sorting anytime.',
  },
  {
    question: 'Which browsers and devices support PDF Editfy?',
    answer:
      'PDF Editfy works on modern desktop and mobile browsers including Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge, Android devices, iPhones, iPads, and Chromebooks.',
  },
];

export const HomeEditorialSection: React.FC<HomeEditorialSectionProps> = ({
  onSelectTool,
  onOpenPage,
  onOpenBlogPost,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section
      aria-label="About PDF Editfy Document Suite"
      className="mt-4 space-y-8 border-t border-slate-200/80 dark:border-slate-800 pt-8 pb-4"
    >
      {/* Architecture & Publisher Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="max-w-3xl space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Complete Online PDF, Office &amp; Image Processing Workstation
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            PDF Editfy brings together 26 focused browser utilities built for students, freelancers,
            accountants, and office teams who need fast document turnaround without desktop software
            installations or subscription paywalls. Every tool is engineered for predictable layout
            fidelity across contracts, invoices, scanned forms, spreadsheets, and web graphics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Local Browser-First Processing
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              PDF rendering, compression, page rotation, OCR recognition, and photo restoration run
              directly inside your device browser, avoiding long upload queues on shared servers.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Privacy &amp; Document Integrity
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Work freely with tax invoices, legal agreements, and personal scans. Nothing requires
              account login, email capture, or third-party cloud storage sync.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Cross-Format Office Compatibility
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Move smoothly between PDF, Word (.docx), Excel (.xlsx/.csv), PowerPoint, and web image
              formats (.jpg, .png, .webp, .ico) from one consistent workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Practical Workflows Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Popular Document &amp; Billing Workflows
            </h3>
          </div>
          <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <button
                  type="button"
                  onClick={() => onSelectTool('compress-pdf')}
                  className="font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Prepare Email-Ready PDFs:
                </button>{' '}
                Shrink heavy multi-page PDF attachments under portal and inbox size caps while keeping
                embedded text legible.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <button
                  type="button"
                  onClick={() => onSelectTool('gst-invoice-generator')}
                  className="font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Generate Clean Tax Invoices:
                </button>{' '}
                Build itemized A4 invoices with company logos, HSN/SAC codes, discounts, CGST/SGST or
                IGST breakdowns, and direct print/PDF export.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <button
                  type="button"
                  onClick={() => onSelectTool('image-enhancer')}
                  className="font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Restore Blurry &amp; Vintage Photos:
                </button>{' '}
                Sharpen soft camera text, remove yellow aging casts on old prints, and enhance detail
                with side-by-side comparison.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <button
                  type="button"
                  onClick={() => onSelectTool('favicon-generator')}
                  className="font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Export Search-Ready Website Favicons:
                </button>{' '}
                Package 48×48+ multi-resolution `.ico`, Apple Touch, SVG, and PWA manifest icon assets
                in a single download.
              </div>
            </li>
          </ul>
        </div>

        {/* Featured Editorial Articles */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Guides &amp; Knowledge Hub</span>
            </h3>
            <button
              type="button"
              onClick={() => onOpenPage('blog')}
              className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1 cursor-pointer"
            >
              <span>All Articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {BLOG_POSTS.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => {
                  if (onOpenBlogPost) onOpenBlogPost(post.slug);
                  else onOpenPage('blog');
                }}
                className="w-full text-left p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/70 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 transition-colors group cursor-pointer block"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                  <span className="text-indigo-600 dark:text-indigo-400">{post.category}</span>
                  <span>{post.readTime}</span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {post.summary}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Homepage FAQs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <span>Common Questions</span>
          </h3>
          <button
            type="button"
            onClick={() => onOpenPage('faq')}
            className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1 cursor-pointer"
          >
            <span>Full FAQ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {HOMEPAGE_FAQS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden self-start"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {item.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
