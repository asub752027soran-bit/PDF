import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Hero } from './components/Hero';
import { ToolGrid } from './components/ToolGrid';
import { Footer } from './components/Footer';
import { AdSenseBanner } from './components/AdSenseBanner';
import { CookieBanner } from './components/CookieBanner';
import { DeploymentModal } from './components/DeploymentModal';

// Tools
import { PDFEditorTool } from './components/tools/PDFEditorTool';
import { PDFMergeSplitTool } from './components/tools/PDFMergeSplitTool';
import { PDFCompressTool } from './components/tools/PDFCompressTool';
import { WordTool } from './components/tools/WordTool';
import { ExcelTool } from './components/tools/ExcelTool';
import { ImageEditorTool } from './components/tools/ImageEditorTool';
import { OCRTool } from './components/tools/OCRTool';
import { UniversalConvertTool } from './components/tools/UniversalConvertTool';

// Pages
import { BlogPage } from './components/pages/BlogPage';
import { FAQPage } from './components/pages/FAQPage';
import { ContactPage } from './components/pages/ContactPage';
import { CompliancePages } from './components/pages/CompliancePages';

// Data & Helpers
import { TOOLS } from './data/toolsData';
import { CategoryType } from './types';
import { updateSEOMeta } from './utils/seo';

export default function App() {
  const [currentCategory, setCurrentCategory] = useState<CategoryType>('All');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('docushift_theme') === 'dark';
  });

  // Recently used tools tracking
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('docushift_recent') || '["edit-pdf", "compress-pdf"]');
    } catch {
      return ['edit-pdf', 'compress-pdf'];
    }
  });

  // VPS Guide Modal
  const [showVPSModal, setShowVPSModal] = useState(false);

  // Sync Dark Mode class on document HTML root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('docushift_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('docushift_theme', 'light');
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
        `DocuShift | ${activePage.toUpperCase()}`,
        'DocuShift free online PDF editor, converter, and file tools.'
      );
    } else {
      updateSEOMeta(
        'DocuShift.io - Free Online PDF Editor, Converter & Compressor',
        'Fast, private online tools to edit PDF, convert Word to PDF, compress images, and merge files without creating an account.'
      );
    }
  }, [activeToolId, activePage]);

  // Launch tool handler
  const handleSelectTool = (toolId: string) => {
    setActiveToolId(toolId);
    setActivePage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update Recently Used
    const updatedRecent = [toolId, ...recentlyUsed.filter((id) => id !== toolId)].slice(0, 5);
    setRecentlyUsed(updatedRecent);
    localStorage.setItem('docushift_recent', JSON.stringify(updatedRecent));
  };

  const handleOpenPage = (pageName: string) => {
    setActivePage(pageName);
    setActiveToolId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setActiveToolId(null);
    setActivePage(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* High Density Navigation Header */}
      <Header
        currentCategory={currentCategory}
        onSelectCategory={(cat) => {
          setCurrentCategory(cat);
          handleGoHome();
        }}
        onSelectTool={handleSelectTool}
        onOpenVPSGuide={() => setShowVPSModal(true)}
        recentlyUsed={recentlyUsed}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onGoHome={handleGoHome}
      />

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

              <ToolGrid
                tools={TOOLS}
                selectedCategory={currentCategory}
                onSelectCategory={setCurrentCategory}
                onSelectTool={handleSelectTool}
                searchQuery={searchQuery}
              />
            </>
          )}

          {/* ACTIVE TOOL WORKSPACES */}
          {activeToolId === 'edit-pdf' && <PDFEditorTool onBack={handleGoHome} />}
          {activeToolId === 'merge-pdf' && <PDFMergeSplitTool mode="merge" onBack={handleGoHome} />}
          {activeToolId === 'split-pdf' && <PDFMergeSplitTool mode="split" onBack={handleGoHome} />}
          {activeToolId === 'compress-pdf' && <PDFCompressTool onBack={handleGoHome} />}

          {(activeToolId === 'pdf-to-word' || activeToolId === 'word-to-pdf' || activeToolId === 'edit-word' || activeToolId === 'word-to-txt') && (
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

    </div>
  );
}

