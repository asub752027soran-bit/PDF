import React, { useState } from 'react';
import {
  ChevronRight,
  ShieldCheck,
  Zap,
  Lock,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  ShieldAlert,
  PanelRight
} from 'lucide-react';
import { TOOL_SEO_DETAILS } from '../../data/toolSeoData';
import { TOOLS } from '../../data/toolsData';
import { ToolItem, CustomAdItem } from '../../types';
import { AdPlacement } from '../AdPlacement';

interface ToolPageLayoutProps {
  toolId: string;
  onSelectTool: (id: string) => void;
  onGoHome: () => void;
  onSelectCategory?: (category: any) => void;
  children: React.ReactNode;
  adsEnabled?: boolean;
  adSlotPlacement?: 'leaderboard' | 'banner' | 'sidebar';
  adSlotsConfig?: {
    leaderboard: boolean;
    banner: boolean;
    sidebar: boolean;
  };
  adServingMode?: 'hybrid' | 'adsense_only' | 'custom_only' | 'fallback';
  customAds?: CustomAdItem[];
  adsensePublisherId?: string;
  adsenseCustomSlots?: {
    leaderboard?: string;
    banner?: string;
    sidebar?: string;
  };
}

export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
  toolId,
  onSelectTool,
  onGoHome,
  onSelectCategory,
  children,
  adsEnabled = true,
  adSlotPlacement = 'banner',
  adSlotsConfig = { leaderboard: true, banner: true, sidebar: true },
  adServingMode = 'hybrid',
  customAds,
  adsensePublisherId,
  adsenseCustomSlots,
}) => {
  const tool = TOOLS.find((t) => t.id === toolId);
  const seoDetail = TOOL_SEO_DETAILS[toolId];
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (!tool) {
    return <>{children}</>;
  }

  const isLeaderboardMode = adSlotPlacement === 'leaderboard';
  const isBannerMode = adSlotPlacement === 'banner';
  const isSidebarMode = adSlotPlacement === 'sidebar';

  const showTopLeaderboard = adsEnabled && (adSlotsConfig?.leaderboard ?? true) && isLeaderboardMode;
  const showInlineBanner = adsEnabled && (adSlotsConfig?.banner ?? true) && (isBannerMode || isLeaderboardMode);
  const showSidebar = adsEnabled && ((adSlotsConfig?.sidebar ?? true) && (isSidebarMode || adSlotsConfig?.sidebar));
  const showBottomLeaderboard = adsEnabled && (adSlotsConfig?.leaderboard ?? true) && isLeaderboardMode;

  const h1 = seoDetail?.h1 || tool.name;
  const shortIntro = seoDetail?.shortIntro || tool.description;
  const howToSteps = seoDetail?.howToSteps || [
    { title: 'Upload File', description: 'Select or drag-and-drop your file into the tool.' },
    { title: 'Configure Options', description: 'Select your preferred settings or edit the document.' },
    { title: 'Process File', description: 'Click process to apply changes instantly.' },
    { title: 'Download Result', description: 'Save your completed file to your device.' }
  ];
  const features = seoDetail?.features || [
    'Fast In-Browser Processing',
    'Zero File Retention Policy',
    'Free to Use with No Account Required',
    'High Output Quality'
  ];
  const faqs = seoDetail?.faqs || [
    { question: `Is ${tool.name} free to use?`, answer: 'Yes! PDF Editfy provides free, unrestricted access to all document and PDF tools with no sign-up or credit card required.' },
    { question: 'Are my files kept private and safe?', answer: 'Yes. All file processing runs securely in your browser memory or temporary encrypted memory buffers that are purged automatically within 15 minutes.' }
  ];
  const relatedTools = (seoDetail?.relatedToolIds || ['edit-pdf', 'compress-pdf', 'merge-pdf', 'pdf-to-word'])
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter(Boolean) as ToolItem[];

  return (
    <div className={`w-full mx-auto pb-12 ${showSidebar ? 'max-w-7xl' : 'max-w-6xl'}`}>
      
      {/* Top Leaderboard Ad Slot (if Leaderboard mode active) */}
      {showTopLeaderboard && (
        <div className="mb-6">
          <AdSenseBanner
            slotType="leaderboard"
            client={adsensePublisherId}
            slot={adsenseCustomSlots?.leaderboard}
            className="my-0"
          />
        </div>
      )}

      <div className={`flex flex-col ${showSidebar ? 'lg:flex-row gap-8 items-start' : 'gap-8'}`}>
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-8 w-full">
          
          {/* Breadcrumbs Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <button
              onClick={onGoHome}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => {
                if (onSelectCategory) onSelectCategory(tool.category);
                onGoHome();
              }}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {tool.category}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 dark:text-white font-bold truncate">
              {tool.name}
            </span>
          </nav>

          {/* Tool Header & Single H1 */}
          <header className="space-y-2 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {tool.category}
              </span>
              {tool.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {tool.badge}
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-medium">
                100% Free • No Signup Required
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {h1}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              {shortIntro}
            </p>
          </header>

          {/* Inline Banner Ad Slot (if Banner mode active) */}
          {showInlineBanner && (
            <div className="my-2">
              <AdSenseBanner
                slotType="banner"
                client={adsensePublisherId}
                slot={adsenseCustomSlots?.banner}
                className="my-0"
              />
            </div>
          )}

          {/* Active Interactive Tool Workspace (100% Preserved Functionality) */}
          <section aria-label="Tool Interactive Workspace" className="w-full">
            {children}
          </section>

          {/* HOW IT WORKS: Step-by-Step Instructions */}
          <section aria-label="How to use instructions" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                How to Use {tool.name} in 4 Simple Steps
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {howToSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 relative"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    {idx + 1}
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* SPECIFICATIONS & PRIVACY COMMITMENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Features & Format Support */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                Key Features &amp; Specifications
              </h2>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                {features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {seoDetail?.supportedInput && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                  <div><strong className="text-slate-700 dark:text-slate-200">Supported Input:</strong> {seoDetail.supportedInput}</div>
                  <div><strong className="text-slate-700 dark:text-slate-200">Supported Output:</strong> {seoDetail.supportedOutput}</div>
                </div>
              )}
            </section>

            {/* Security & Zero Data Retention */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                Privacy &amp; Security Guarantee
              </h2>
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 dark:text-slate-100 block">Zero Permanent File Storage</strong>
                    Your documents belong solely to you. We never sell, index, or retain your uploaded files.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 dark:text-slate-100 block">Automatic 15-Minute Purge</strong>
                    All temporary memory buffers are automatically deleted within 15 minutes of completion.
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* FREQUENTLY ASKED QUESTIONS (FAQ) */}
          {faqs.length > 0 && (
            <section aria-label="Frequently asked questions" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {faq.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="p-4 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bottom Leaderboard Ad Slot (if Leaderboard mode active) */}
          {showBottomLeaderboard && (
            <div className="my-6">
              <AdSenseBanner
                slotType="leaderboard"
                client={adsensePublisherId}
                slot={adsenseCustomSlots?.leaderboard}
                className="my-0"
              />
            </div>
          )}

          {/* RELATED TOOLS (INTERNAL LINKING FOR GOOGLE SEARCH CRAWLERS) */}
          {relatedTools.length > 0 && (
            <section aria-label="Related tools" className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Related PDF &amp; Document Tools
                </h2>
                <button
                  onClick={onGoHome}
                  className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors flex items-center gap-1"
                >
                  View All Tools <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {relatedTools.map((relTool) => (
                  <div
                    key={relTool.id}
                    onClick={() => onSelectTool(relTool.id)}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {relTool.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {relTool.category.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {relTool.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Sticky Desktop Sidebar Ad Column (if Sidebar mode is active) */}
        {showSidebar && (
          <aside className="w-full lg:w-[320px] shrink-0 space-y-5 lg:sticky lg:top-6 self-start">
            
            {/* Sticky AdSense Sidebar Banner */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <AdSenseBanner
                slotType="sidebar"
                client={adsensePublisherId}
                slot={adsenseCustomSlots?.sidebar}
                className="my-0"
              />
            </div>

            {/* Quick Security & Privacy Assurance */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Security Assurance</span>
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>Files processed directly in your local browser sandbox</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>Zero cloud storage or permanent retention</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>No login or credit card required</span>
                </li>
              </ul>
            </div>

            {/* Quick Tool Links Card */}
            {relatedTools.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Quick Tool Switch</span>
                </h4>
                <div className="space-y-1.5">
                  {relatedTools.slice(0, 3).map((rt) => (
                    <button
                      key={rt.id}
                      onClick={() => onSelectTool(rt.id)}
                      className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">{rt.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </aside>
        )}

      </div>

    </div>
  );
};
