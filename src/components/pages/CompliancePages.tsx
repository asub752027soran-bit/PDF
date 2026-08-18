import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, AlertTriangle, Info } from 'lucide-react';
import { AdSenseBanner } from '../AdSenseBanner';

interface CompliancePagesProps {
  page: 'privacy' | 'terms' | 'disclaimer' | 'about';
  onBack: () => void;
}

export const CompliancePages: React.FC<CompliancePagesProps> = ({ page, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Ad */}
      <AdSenseBanner slotType="banner" className="my-2" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <div className="text-right">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white capitalize flex items-center gap-2 justify-end">
            {page === 'privacy' && <ShieldCheck className="w-5 h-5 text-indigo-600" />}
            {page === 'terms' && <FileText className="w-5 h-5 text-indigo-600" />}
            {page === 'disclaimer' && <AlertTriangle className="w-5 h-5 text-indigo-600" />}
            {page === 'about' && <Info className="w-5 h-5 text-indigo-600" />}
            {page === 'privacy' ? 'Privacy Policy' : page === 'terms' ? 'Terms & Conditions' : page === 'disclaimer' ? 'Disclaimer' : 'About Us'}
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: August 2026 • pdfeditfy.com Online Platform
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        
        {page === 'privacy' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. Zero Permanent Storage Commitment</h3>
            <p>
              pdfeditfy.com respects your data privacy. We do not require account registration, login credentials, or personal email addresses. Most PDF, Word, Excel, and image editing tools run directly inside your web browser memory.
            </p>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">2. Automatic Temporary File Deletion</h3>
            <p>
              When a document is converted or compressed, temporary RAM or disk buffers are allocated exclusively for the duration of your session. All temporary file fragments are automatically purged from our servers within 15 minutes.
            </p>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">3. Cookies & Google AdSense Compliance</h3>
            <p>
              We use standard browser local storage to persist user interface preferences (such as light/dark mode and recently used tool shortcuts). We partner with Google AdSense to display non-intrusive advertisements that help keep our tools 100% free for everyone.
            </p>
          </div>
        )}

        {page === 'terms' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. Acceptable Use</h3>
            <p>
              pdfeditfy.com provides document conversion, PDF editing, compression, and image processing tools for personal and professional use. Users are prohibited from using the service to process unlawful or malicious material.
            </p>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">2. No Account & Free Service</h3>
            <p>
              All tools are accessible without creating an account or paying subscription fees. We reserve the right to apply fair rate limits to protect infrastructure stability.
            </p>
          </div>
        )}

        {page === 'disclaimer' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. Service Provided "As-Is"</h3>
            <p>
              pdfeditfy.com algorithms aim to deliver accurate document formatting and image compression. However, the service is provided on an "as-is" basis without warranties of uninterrupted availability.
            </p>
          </div>
        )}

        {page === 'about' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Our Mission</h3>
            <p>
              pdfeditfy.com was created to eliminate paywalls, intrusive login requirements, and software installation hurdles for basic document tasks. Whether you need to sign a PDF contract, convert a spreadsheet, or compress an image, pdfeditfy.com provides fast, browser-first tools.
            </p>
          </div>
        )}

      </div>

      {/* Bottom Ad */}
      <AdSenseBanner slotType="leaderboard" className="mt-6" />

    </div>
  );
};
