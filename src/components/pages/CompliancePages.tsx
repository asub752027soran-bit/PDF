import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, AlertTriangle, Info, Lock, ExternalLink, Mail, Server, Cpu } from 'lucide-react';

interface CompliancePagesProps {
  page: 'privacy' | 'terms' | 'disclaimer' | 'about';
  onBack: () => void;
}

export const CompliancePages: React.FC<CompliancePagesProps> = ({ page, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header (Note: In strict compliance with Google AdSense Publisher Policies, no advertising tags are placed on legal and policy pages) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <div className="text-right">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white capitalize flex items-center gap-2 justify-end">
            {page === 'privacy' && <ShieldCheck className="w-5 h-5 text-blue-600" />}
            {page === 'terms' && <FileText className="w-5 h-5 text-blue-600" />}
            {page === 'disclaimer' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {page === 'about' && <Info className="w-5 h-5 text-blue-600" />}
            {page === 'privacy' ? 'Privacy Policy' : page === 'terms' ? 'Terms of Service' : page === 'disclaimer' ? 'Disclaimer' : 'About Us'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Last Updated: September 2026 • PDF Editfy (pdfeditfy.com)
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        
        {/* ========================================================
            PRIVACY POLICY (STRICT GOOGLE ADSENSE, GDPR & CCPA COMPLIANCE)
           ======================================================== */}
        {page === 'privacy' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
              <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
                <strong>Our Core Privacy Promise:</strong> PDF Editfy operates with a client-first, privacy-by-design architecture. Your PDF documents, Word files, spreadsheets, and personal images are processed directly inside your device browser memory via WebAssembly and HTML5 Canvas. We do not require accounts, we do not inspect your document contents, and we do not store your files on permanent servers.
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Information We Do and Do Not Collect</h2>
              <p>
                <strong>No Document Content Logging:</strong> When you use our PDF editor, compressor, converters, or signature tools, files are read locally into your client runtime. Document contents, text layers, signatures, and image pixels are not saved to any external database or sold to third parties.
              </p>
              <p>
                <strong>Device &amp; Analytics Information:</strong> Like almost all modern web properties, our hosting infrastructure may collect standard, non-personally identifiable log information (such as browser type, operating system, referring URL, date/time stamps, and approximate country-level geographic location) purely for performance monitoring, load balancing, and anti-abuse bot mitigation.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Google AdSense, Advertising Cookies &amp; Third-Party Partners</h2>
              <p>
                PDF Editfy partners with Google and third-party advertising vendors to display advertisements across our free service. These advertisements support server bandwidth and ongoing engineering development so that our tools remain 100% free for all users worldwide.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Google AdSense &amp; DART Cookies:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites across the Internet.
                </li>
                <li>
                  <strong>Personalized Advertising:</strong> Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to PDF Editfy and other sites on the Internet.
                </li>
                <li>
                  <strong>Opting Out of Personalized Advertising:</strong> You may opt out of personalized advertising at any time by visiting Google's official Ads Settings at{' '}
                  <a
                    href="https://www.google.com/settings/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline font-semibold inline-flex items-center gap-1"
                  >
                    Google Ads Settings <ExternalLink className="w-3 h-3" />
                  </a>. Alternatively, you can opt out of third-party vendor cookies for personalized advertising by visiting{' '}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline font-semibold inline-flex items-center gap-1"
                  >
                    www.aboutads.info <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  or the Network Advertising Initiative at{' '}
                  <a
                    href="https://optout.networkadvertising.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline font-semibold inline-flex items-center gap-1"
                  >
                    optout.networkadvertising.org <ExternalLink className="w-3 h-3" />
                  </a>.
                </li>
                <li>
                  <strong>Google's Partner Policy:</strong> To learn more about how Google handles and processes information collected through partner sites and applications, please review{' '}
                  <a
                    href="https://policies.google.com/technologies/partner-sites"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline font-semibold inline-flex items-center gap-1"
                  >
                    How Google uses information from sites or apps that use our services <ExternalLink className="w-3 h-3" />
                  </a>.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Cookies &amp; Local Browser Storage</h2>
              <p>
                PDF Editfy utilizes client-side Web Storage (HTML5 LocalStorage and SessionStorage) strictly to preserve user interface preferences. For example:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your preferred visual theme (Light Mode vs. Dark Mode).</li>
                <li>Recent tool shortcuts for faster navigation.</li>
                <li>Your cookie consent acknowledgment banner state.</li>
              </ul>
              <p>
                You can manage, restrict, or clear cookies and local storage directly through your browser settings (Chrome, Firefox, Safari, Edge). Disabling storage will not restrict access to our document conversion tools.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">4. California Consumer Privacy Act (CCPA / CPRA) Compliance</h2>
              <p>
                If you are a California resident, the California Consumer Privacy Act (CCPA) provides specific rights regarding your personal information:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Right to Know:</strong> You have the right to request details on the categories of personal data collected. As described above, PDF Editfy does not require user accounts or harvest personal identifiers.</li>
                <li><strong>Right to Delete:</strong> Because documents are processed within your client browser memory and not stored on permanent databases, your document data is erased immediately when you close or reload your browser tab.</li>
                <li><strong>No Sale of Personal Information:</strong> PDF Editfy does not sell, rent, or trade your personal data or document contents to any data broker or advertiser.</li>
                <li><strong>Non-Discrimination:</strong> We will never discriminate against you for exercising your CCPA privacy rights.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">5. European Union General Data Protection Regulation (GDPR) Compliance</h2>
              <p>
                For visitors within the European Economic Area (EEA) and the United Kingdom, our legal basis for processing any technical access data is our legitimate interest in securing our website and delivering browser-based utilities. You maintain the right to access, rectify, or request deletion of any identifiable server log data. For any GDPR-related inquiries or data requests, please contact our Data Protection Officer at <strong>privacy@pdfeditfy.com</strong> or <strong>asbsoran@gmail.com</strong>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">6. Children's Online Privacy Protection (COPPA)</h2>
              <p>
                PDF Editfy does not knowingly solicit or collect personal information from children under the age of 13. If you believe a minor has provided personal details through our feedback forms, please contact us immediately so we can expunge the record.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">7. Changes to This Privacy Policy</h2>
              <p>
                We may periodically update this Privacy Policy to reflect technical enhancements, browser security standards, or regulatory updates. Any changes will be published here with an updated "Last Updated" date.
              </p>
            </section>

            <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">8. Contact Us Regarding Privacy</h2>
              <p>
                If you have questions, comments, or concerns regarding our privacy practices or data policies, reach out to us at:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-white">PDF Editfy Privacy &amp; Legal Team</p>
                <p>Website: <a href="https://pdfeditfy.com" className="text-blue-600 underline">https://pdfeditfy.com</a></p>
                <p>Email: <a href="mailto:support@pdfeditfy.com" className="text-blue-600 underline">support@pdfeditfy.com</a> / <a href="mailto:asbsoran@gmail.com" className="text-blue-600 underline">asbsoran@gmail.com</a></p>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            ABOUT US (TRANSPARENCY, AUTHORSHIP & EDITORIAL INTEGRITY)
           ======================================================== */}
        {page === 'about' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Our Mission &amp; Purpose</h2>
              <p>
                <strong>PDF Editfy</strong> was built with a singular vision: to liberate daily document productivity from expensive subscription paywalls, intrusive login barriers, and high-risk file uploads.
              </p>
              <p>
                Every day, millions of students, educators, legal professionals, freelancers, and small business owners need to sign a PDF contract, compress a scanned receipt, merge client reports, or convert a spreadsheet. Too often, existing web tools enforce 2-page limits, force users to hand over their email addresses, or secretly upload proprietary documents to remote cloud storage.
              </p>
              <p>
                PDF Editfy changes this paradigm by providing a completely free, private, high-performance web workstation that runs directly in your web browser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 w-fit">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Client-Side Architecture</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  We utilize WebAssembly, HTML5 Canvas, and modern browser standards to manipulate PDF and image binaries locally on your computer hardware.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 w-fit">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Zero File Retention</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Because processing happens on your device, your confidential contracts, medical scans, tax documents, and personal photos never touch persistent server disks.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 w-fit">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Always Free &amp; Open</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  No hidden credit card trials, no watermarks, and no signups required. High-grade tools accessible to everyone in every country.
                </p>
              </div>
            </div>

            <section className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">What Makes PDF Editfy Unique?</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Comprehensive Tool Arsenal:</strong> Over 30 specialized utilities covering PDF editing, page reordering, compression, Word/Excel/PowerPoint conversions, OCR text extraction, watermark protection, and password locking.</li>
                <li><strong>Uncompromising Visual Fidelity:</strong> Intelligent compression and vector rendering ensure your exported documents retain sharp text, accurate fonts, and pristine table geometry.</li>
                <li><strong>Mobile &amp; Desktop Optimized:</strong> Fully responsive interface that works identically on smartphones, tablets, Chromebooks, laptops, and ultra-wide desktop monitors.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Editorial &amp; Engineering Standards</h2>
              <p>
                Our engineering team continuously updates our tool suites and Knowledge Hub tutorials to ensure compatibility with modern PDF 2.0 specifications, Office Open XML standards, and modern image formats (including AVIF and WebP).
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">Publisher &amp; Operator Information</p>
                <p>Platform Name: PDF Editfy</p>
                <p>Domain: <a href="https://pdfeditfy.com" className="text-blue-600 underline">https://pdfeditfy.com</a></p>
                <p>Contact / Support: <a href="mailto:support@pdfeditfy.com" className="text-blue-600 underline">support@pdfeditfy.com</a></p>
                <p>Lead Engineer Contact: <a href="mailto:asbsoran@gmail.com" className="text-blue-600 underline">asbsoran@gmail.com</a></p>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            TERMS OF SERVICE
           ======================================================== */}
        {page === 'terms' && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Agreement to Terms</h2>
              <p>
                By accessing and using PDF Editfy (accessible at pdfeditfy.com), you agree to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you disagree with any of these terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Permitted &amp; Acceptable Use</h2>
              <p>
                You are granted a non-exclusive, non-transferable, revocable license to access and use PDF Editfy strictly in accordance with these terms for personal, academic, and commercial document editing and conversion tasks.
              </p>
              <p>You expressly agree NOT to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the service to process, generate, or distribute malicious code, ransomware, virus payloads, or infringing content.</li>
                <li>Attempt to reverse-engineer, decompile, or bypass any security features or rate-limiting safeguards on the platform.</li>
                <li>Deploy automated scraping bots, spiders, or denial-of-service scripts against our server infrastructure.</li>
                <li>Impersonate another person, entity, or misrepresent your affiliation with PDF Editfy.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Intellectual Property Rights Over Your Content</h2>
              <p>
                You retain 100% of all intellectual property rights, copyright, and ownership of the files, images, documents, and text you process using PDF Editfy. We claim no ownership, license, or rights to your processed documents.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Availability &amp; Modifications</h2>
              <p>
                We strive to maintain 99.9% uptime. However, we reserve the right to modify, suspend, or discontinue any feature, tool, or endpoint of the service at any time without prior notice or liability.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">5. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with applicable general consumer protection laws without regard to conflict of law provisions.
              </p>
            </section>
          </div>
        )}

        {/* ========================================================
            DISCLAIMER
           ======================================================== */}
        {page === 'disclaimer' && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">1. "As-Is" Service Disclaimer</h2>
              <p>
                The tools and services provided on PDF Editfy are provided on an "as-is" and "as-available" basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Document Integrity &amp; Backup Responsibility</h2>
              <p>
                While our conversion and compression engines utilize precision algorithms, complex document formatting (such as proprietary fonts, dynamic macros, custom mathematical formulas, or deeply nested vector layers) may occasionally render differently across various third-party PDF viewers.
              </p>
              <p>
                <strong>Always retain a secure backup of your original files</strong> before performing irreversible operations such as page deletion, extreme compression, or redaction.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Limitation of Liability</h2>
              <p>
                In no event shall PDF Editfy, its developers, operators, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages (including loss of profits, data, goodwill, or business interruption) arising out of or related to your use of or inability to use the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">4. External Links &amp; Third-Party Advertisements</h2>
              <p>
                PDF Editfy may display third-party advertisements or external links provided by Google AdSense and its partners. We do not endorse, guarantee, or assume responsibility for the products, services, claims, or privacy practices of external third-party advertisers or destination websites.
              </p>
            </section>
          </div>
        )}

      </div>

    </div>
  );
};
