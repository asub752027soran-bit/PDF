import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Hero } from './components/Hero';
import { ToolGrid } from './components/ToolGrid';
import { Footer } from './components/Footer';
import { AdSenseBanner } from './components/AdSenseBanner';
import { CookieBanner } from './components/CookieBanner';
import { DeploymentModal } from './components/DeploymentModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';

// Lazy Loaded Tool Components
const PDFEditorTool = lazy(() => import('./components/tools/PDFEditorTool').then(m => ({ default: m.PDFEditorTool })));
const PDFMergeSplitTool = lazy(() => import('./components/tools/PDFMergeSplitTool').then(m => ({ default: m.PDFMergeSplitTool })));
const PDFCompressTool = lazy(() => import('./components/tools/PDFCompressTool').then(m => ({ default: m.PDFCompressTool })));
const WordTool = lazy(() => import('./components/tools/WordTool').then(m => ({ default: m.WordTool })));
const ExcelTool = lazy(() => import('./components/tools/ExcelTool').then(m => ({ default: m.ExcelTool })));
const ImageEditorTool = lazy(() => import('./components/tools/ImageEditorTool').then(m => ({ default: m.ImageEditorTool })));
const OCRTool = lazy(() => import('./components/tools/OCRTool').then(m => ({ default: m.OCRTool })));
const UniversalConvertTool = lazy(() => import('./components/tools/UniversalConvertTool').then(m => ({ default: m.UniversalConvertTool })));

// Lazy Loaded Pages & Admin Components
const BlogPage = lazy(() => import('./components/pages/BlogPage').then(m => ({ default: m.BlogPage })));
const FAQPage = lazy(() => import('./components/pages/FAQPage').then(m => ({ default: m.FAQPage })));
const ContactPage = lazy(() => import('./components/pages/ContactPage').then(m => ({ default: m.ContactPage })));
const CompliancePages = lazy(() => import('./components/pages/CompliancePages').then(m => ({ default: m.CompliancePages })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// Loading Spinner Fallback for Lazy Loaded Components
const ToolLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">Loading Tool Workspace...</p>
    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Initializing fast browser processor</p>
  </div>
);

// Data & Helpers
import { TOOLS } from './data/toolsData';
import { CategoryType, AdminConfig } from './types';
import { LanguageCode } from './data/translations';
import { updateSEOMeta } from './utils/seo';
import { Megaphone, AlertTriangle } from 'lucide-react';
import { auth, onAuthStateChanged, signOut as firebaseSignOut } from './lib/firebase';

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  siteName: 'pdfeditfy.com',
  announcementBar: {
    enabled: true,
    text: '🎉 Welcome to pdfeditfy.com - Fast & private PDF tools, Word converters, and image compressor!',
    type: 'info',
  },
  maintenanceMode: false,
  adsensePublisherId: 'ca-pub-1234567890123456',
  adsEnabled: true,
  disabledTools: [],
  customBadges: {},
  adminPasscode: 'Sobha@752027',
  analyticsEnabled: true,
  gaTrackingId: 'G-PDFEDITFY01',
  maxUploadSizeMB: 100,
};

export default function App() {
  const [currentCategory, setCurrentCategory] = useState<CategoryType>('All');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Single Admin State & Config
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() => {
    try {
      const saved = localStorage.getItem('pdfeditfy_admin_config');
      return saved ? JSON.parse(saved) : DEFAULT_ADMIN_CONFIG;
    } catch {
      return DEFAULT_ADMIN_CONFIG;
    }
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('pdfeditfy_admin_authed') === 'true';
  });

  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);

  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pdfeditfy_theme') || localStorage.getItem('docushift_theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Recently used tools tracking
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pdfeditfy_recent') || localStorage.getItem('docushift_recent') || '["edit-pdf", "compress-pdf"]');
    } catch {
      return ['edit-pdf', 'compress-pdf'];
    }
  });

  // Language state
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    return (localStorage.getItem('pdfeditfy_lang') as LanguageCode) || 'en';
  });

  // VPS Guide Modal
  const [showVPSModal, setShowVPSModal] = useState(false);

  // Sync Dark Mode class on document HTML root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('pdfeditfy_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('pdfeditfy_theme', 'light');
    }
  }, [darkMode]);

  // Dynamic SEO Title & Meta update based on active view
  useEffect(() => {
    if (activeToolId) {
      const tool = TOOLS.find((t) => t.id === activeToolId);
      if (tool) {
        updateSEOMeta(tool.seoTitle, tool.seoDescription);
      }
    } else if (activePage) {
      updateSEOMeta(
        `pdfeditfy.com | ${activePage.toUpperCase()}`,
        'pdfeditfy.com free online PDF editor, converter, and file tools.'
      );
    } else {
      updateSEOMeta(
        'pdfeditfy.com - Free Online PDF Editor, Converter & Compressor',
        'Fast, private online tools to edit PDF, convert Word to PDF, compress images, and merge files without creating an account.'
      );
    }
  }, [activeToolId, activePage]);

  // Update admin config helper
  const handleUpdateAdminConfig = (newConfig: AdminConfig) => {
    setAdminConfig(newConfig);
    localStorage.setItem('pdfeditfy_admin_config', JSON.stringify(newConfig));
  };

  const [adminInitialTab, setAdminInitialTab] = useState<'overview' | 'tools' | 'monetization' | 'inquiries' | 'seo' | 'security' | 'vps'>('overview');

  // Admin login trigger
  const handleOpenAdminConsole = (targetTab?: string) => {
    if (targetTab) {
      setAdminInitialTab(targetTab as any);
    }
    if (isAdminLoggedIn) {
      setActivePage('admin');
      setActiveToolId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowAdminLogin(true);
    }
  };

  // Firebase Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem('pdfeditfy_admin_authed', 'true');
        if (!localStorage.getItem('pdfeditfy_admin_google_user')) {
          localStorage.setItem(
            'pdfeditfy_admin_google_user',
            JSON.stringify({
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email?.split('@')[0],
              photoURL: user.photoURL,
              authenticatedAt: new Date().toISOString(),
              provider: 'firebase',
              role: 'SUPER_ADMIN'
            })
          );
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('pdfeditfy_admin_authed', 'true');
    setShowAdminLogin(false);
    setActivePage('admin');
    setActiveToolId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Firebase logout notice:', err);
    }
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('pdfeditfy_admin_authed');
    localStorage.removeItem('pdfeditfy_admin_google_user');
    setActivePage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // URL Route Parser for deep-linking (sitemap crawling & direct links)
  useEffect(() => {
    const parseRoute = () => {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const params = new URLSearchParams(window.location.search);

      // Tool route matching
      let toolMatch: string | null = null;
      if (path.startsWith('tool/')) {
        toolMatch = path.replace('tool/', '');
      } else if (hash.startsWith('tool/')) {
        toolMatch = hash.replace('tool/', '');
      } else if (params.get('tool')) {
        toolMatch = params.get('tool');
      }

      if (toolMatch && TOOLS.some(t => t.id === toolMatch)) {
        setActiveToolId(toolMatch);
        setActivePage(null);
        return;
      }

      // Page route matching
      const validPages = ['about', 'privacy', 'terms', 'disclaimer', 'contact', 'faq', 'blog', 'admin'];
      let pageMatch: string | null = null;

      if (validPages.includes(path)) {
        pageMatch = path;
      } else if (validPages.includes(hash)) {
        pageMatch = hash;
      } else if (params.get('page') && validPages.includes(params.get('page')!)) {
        pageMatch = params.get('page');
      }

      if (pageMatch) {
        if (pageMatch === 'admin' && !sessionStorage.getItem('pdfeditfy_admin_authed')) {
          setShowAdminLogin(true);
        } else {
          setActivePage(pageMatch);
          setActiveToolId(null);
        }
      }
    };

    parseRoute();
    window.addEventListener('popstate', parseRoute);
    return () => window.removeEventListener('popstate', parseRoute);
  }, []);

  // Launch tool handler with URL pushState
  const handleSelectTool = (toolId: string) => {
    if (adminConfig.disabledTools.includes(toolId)) {
      alert('This tool is currently under maintenance by the administrator. Please try another tool.');
      return;
    }
    setActiveToolId(toolId);
    setActivePage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.location.pathname !== `/tool/${toolId}`) {
      window.history.pushState({}, '', `/tool/${toolId}`);
    }

    // Update Recently Used
    const updatedRecent = [toolId, ...recentlyUsed.filter((id) => id !== toolId)].slice(0, 5);
    setRecentlyUsed(updatedRecent);
    localStorage.setItem('pdfeditfy_recent', JSON.stringify(updatedRecent));
  };

  const handleOpenPage = (pageName: string) => {
    if (pageName === 'admin') {
      handleOpenAdminConsole();
      return;
    }
    setActivePage(pageName);
    setActiveToolId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.location.pathname !== `/${pageName}`) {
      window.history.pushState({}, '', `/${pageName}`);
    }
  };

  const handleGoHome = () => {
    setActiveToolId(null);
    setActivePage(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Announcement Bar (Configured via Admin Panel) */}
      {adminConfig.announcementBar.enabled && adminConfig.announcementBar.text && (
        <div className={`px-4 py-2 text-center text-xs font-extrabold flex items-center justify-center gap-2 shrink-0 ${
          adminConfig.announcementBar.type === 'warning'
            ? 'bg-amber-500 text-slate-950'
            : adminConfig.announcementBar.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-blue-600 text-white'
        }`}>
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          <span>{adminConfig.announcementBar.text}</span>
        </div>
      )}

      {/* High Density Navigation Header */}
      <Header
        currentCategory={currentCategory}
        onSelectCategory={(cat) => {
          setCurrentCategory(cat);
          handleGoHome();
        }}
        onSelectTool={handleSelectTool}
        onOpenVPSGuide={() => setShowVPSModal(true)}
        onOpenAdmin={handleOpenAdminConsole}
        recentlyUsed={recentlyUsed}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onGoHome={handleGoHome}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
      />

      {/* Maintenance Mode Overlay Notice */}
      {adminConfig.maintenanceMode && activePage !== 'admin' && (
        <div className="bg-amber-50 dark:bg-amber-950/80 border-b border-amber-200 dark:border-amber-800 p-4 text-center text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Notice: Scheduled maintenance is in progress. Some tools may operate in restricted mode.</span>
          <button
            onClick={handleOpenAdminConsole}
            className="underline font-bold text-amber-900 dark:text-amber-100 hover:text-blue-600"
          >
            Admin Login
          </button>
        </div>
      )}

      {/* Main Content & Sidebar Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar for High Density Homepage */}
        {!activeToolId && !activePage && (
          <Sidebar
            currentCategory={currentCategory}
            onSelectCategory={setCurrentCategory}
            recentlyUsed={recentlyUsed}
            onSelectTool={handleSelectTool}
            onOpenPage={handleOpenPage}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 gap-6 overflow-y-auto">
          
          {/* HOMEPAGE VIEW */}
          {!activeToolId && !activePage && (
            <>
              <Hero
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onQuickSelect={handleSelectTool}
              />

              {adminConfig.adsEnabled && <AdSenseBanner slotType="leaderboard" />}

              <ToolGrid
                tools={TOOLS}
                selectedCategory={currentCategory}
                onSelectCategory={setCurrentCategory}
                onSelectTool={handleSelectTool}
                searchQuery={searchQuery}
                disabledTools={adminConfig.disabledTools}
                customBadges={adminConfig.customBadges}
              />
            </>
          )}

          {/* ACTIVE TOOL WORKSPACES & PAGES WITH SUSPENSE LAZY LOADING */}
          <Suspense fallback={<ToolLoadingFallback />}>
            {activeToolId === 'edit-pdf' && <PDFEditorTool mode="edit" onBack={handleGoHome} />}
            {activeToolId === 'watermark-pdf' && <PDFEditorTool mode="watermark" onBack={handleGoHome} />}
            {activeToolId === 'lock-pdf' && <PDFEditorTool mode="lock" onBack={handleGoHome} />}
            {activeToolId === 'unlock-pdf' && <PDFEditorTool mode="unlock" onBack={handleGoHome} />}

            {activeToolId === 'merge-pdf' && <PDFMergeSplitTool mode="merge" onBack={handleGoHome} />}
            {activeToolId === 'split-pdf' && <PDFMergeSplitTool mode="split" onBack={handleGoHome} />}
            {activeToolId === 'organize-pdf' && <PDFMergeSplitTool mode="organize" onBack={handleGoHome} />}

            {activeToolId === 'compress-pdf' && <PDFCompressTool onBack={handleGoHome} />}

            {(activeToolId === 'pdf-to-word' || activeToolId === 'word-to-pdf' || activeToolId === 'edit-word' || activeToolId === 'word-to-txt' || activeToolId === 'ppt-to-pdf') && (
              <WordTool onBack={handleGoHome} />
            )}

            {(activeToolId === 'pdf-to-excel' || activeToolId === 'excel-to-pdf' || activeToolId === 'edit-excel' || activeToolId === 'csv-excel-converter') && (
              <ExcelTool onBack={handleGoHome} />
            )}

            {(activeToolId === 'image-converter' || activeToolId === 'image-compressor' || activeToolId === 'image-resizer' || activeToolId === 'image-to-pdf' || activeToolId === 'pdf-to-image') && (
              <ImageEditorTool onBack={handleGoHome} />
            )}

            {activeToolId === 'ocr-reader' && <OCRTool onBack={handleGoHome} />}
            {activeToolId === 'universal-converter' && <UniversalConvertTool onBack={handleGoHome} />}

            {/* COMPLIANCE & CONTENT PAGES */}
            {activePage === 'blog' && <BlogPage onBack={handleGoHome} onSelectTool={handleSelectTool} />}
            {activePage === 'faq' && <FAQPage onBack={handleGoHome} />}
            {activePage === 'contact' && <ContactPage onBack={handleGoHome} />}
            {(activePage === 'privacy' || activePage === 'terms' || activePage === 'disclaimer' || activePage === 'about') && (
              <CompliancePages page={activePage as any} onBack={handleGoHome} />
            )}

            {/* ADMIN DASHBOARD PAGE */}
            {activePage === 'admin' && isAdminLoggedIn && (
              <AdminDashboard
                onBack={handleGoHome}
                config={adminConfig}
                onUpdateConfig={handleUpdateAdminConfig}
                onLogout={handleAdminLogout}
                initialTab={adminInitialTab}
              />
            )}
          </Suspense>

        </main>
      </div>

      {/* Footer & Cookie Banner */}
      <Footer
        onSelectCategory={(cat) => {
          setCurrentCategory(cat);
          handleGoHome();
        }}
        onSelectTool={handleSelectTool}
        onOpenPage={handleOpenPage}
      />

      <CookieBanner />

      <DeploymentModal
        isOpen={showVPSModal}
        onClose={() => setShowVPSModal(false)}
      />

      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        currentPasscode={adminConfig.adminPasscode}
      />

    </div>
  );
}

