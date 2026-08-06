import React from 'react';
import { FileStack, ShieldCheck, Zap, Lock, Heart, FileText, HelpCircle, BookOpen, Mail, ShieldAlert } from 'lucide-react';
import { CategoryType } from '../types';

interface FooterProps {
  onSelectCategory: (cat: CategoryType) => void;
  onSelectTool: (toolId: string) => void;
  onOpenPage: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onSelectTool,
  onOpenPage,
}) => {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800 text-xs">
          <div className="flex items-start gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1 text-sm">No Account Needed</h4>
              <p className="text-slate-400 leading-relaxed">
                Zero signup or login requirements. Use all PDF, Word, Excel, and Image tools instantly.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1 text-sm">100% Secure & Private</h4>
              <p className="text-slate-400 leading-relaxed">
                Files process directly in your browser memory or auto-delete from temporary buffers in 15 mins.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1 text-sm">AdSense Compliant</h4>
              <p className="text-slate-400 leading-relaxed">
                Designed according to Google webmaster and advertisement quality policies with transparent privacy terms.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1 text-sm">Batch Processing</h4>
              <p className="text-slate-400 leading-relaxed">
                Convert, compress, and merge multiple documents simultaneously with instant ZIP archive export.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-b border-slate-800">
          
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <FileStack className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                pdfeditfy.com
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The premier online suite for fast, secure file conversions, PDF editing, compression, and image manipulation. Free forever for everyone with zero signup restrictions.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              All trademarks, product names, and company logos mentioned are property of their respective owners.
            </div>
          </div>

          {/* Popular Tools */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 mb-4">
              Popular Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onSelectTool('edit-pdf')} className="hover:text-indigo-400 transition-colors">
                  Edit PDF
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('merge-pdf')} className="hover:text-indigo-400 transition-colors">
                  Merge PDF
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('compress-pdf')} className="hover:text-indigo-400 transition-colors">
                  Compress PDF
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('pdf-to-word')} className="hover:text-indigo-400 transition-colors">
                  PDF to Word
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('image-converter')} className="hover:text-indigo-400 transition-colors">
                  Image Converter
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTool('ocr-reader')} className="hover:text-indigo-400 transition-colors">
                  OCR Text Extractor
                </button>
              </li>
            </ul>
          </div>

          {/* Tool Categories */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 mb-4">
              Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onSelectCategory('PDF Tools')} className="hover:text-indigo-400 transition-colors">
                  PDF Tools
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Word Tools')} className="hover:text-indigo-400 transition-colors">
                  Word Tools
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Excel Tools')} className="hover:text-indigo-400 transition-colors">
                  Excel Tools
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('PowerPoint Tools')} className="hover:text-indigo-400 transition-colors">
                  PowerPoint Tools
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Image Tools')} className="hover:text-indigo-400 transition-colors">
                  Image Tools
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Compression Tools')} className="hover:text-indigo-400 transition-colors">
                  Compression Tools
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Pages */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 mb-4">
              Pages & Policy
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onOpenPage('about')} className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-slate-500" /> About Us
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPage('privacy')} className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-slate-500" /> Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPage('terms')} className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-slate-500" /> Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPage('disclaimer')} className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-slate-500" /> Disclaimer
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPage('faq')} className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <HelpCircle className="w-3 h-3 text-slate-500" /> FAQ
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPage('blog')} className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-slate-500" /> Blog & Guides
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPage('contact')} className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-500" /> Contact Us
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom High Density Status & Policy Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px]">
            <button onClick={() => onOpenPage('about')} className="hover:text-slate-200 transition-colors">
              About Us
            </button>
            <button onClick={() => onOpenPage('privacy')} className="hover:text-slate-200 transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => onOpenPage('terms')} className="hover:text-slate-200 transition-colors">
              Terms of Service
            </button>
            <button onClick={() => onOpenPage('contact')} className="hover:text-slate-200 transition-colors">
              Contact Support
            </button>
            <button onClick={() => onOpenPage('admin')} className="hover:text-blue-400 text-blue-400 font-bold transition-colors flex items-center gap-1">
              Admin Console
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-medium">Server Status: Online & Secure</span>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} pdfeditfy.com. All rights reserved. Client-Side Document Utilities.</p>
          <div className="flex items-center gap-3">
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:underline text-slate-400">
              Sitemap.xml
            </a>
            <a href="/robots.txt" target="_blank" rel="noreferrer" className="hover:underline text-slate-400">
              Robots.txt
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
