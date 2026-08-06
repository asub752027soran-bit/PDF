import React, { useState } from 'react';
import {
  Search,
  Moon,
  Sun,
  Server,
  Clock,
  ChevronDown,
  X,
  Zap,
  ArrowRight,
  FileText
} from 'lucide-react';
import { CATEGORIES, TOOLS } from '../data/toolsData';
import { CategoryType } from '../types';

interface HeaderProps {
  currentCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
  onSelectTool: (toolId: string) => void;
  onOpenVPSGuide: () => void;
  recentlyUsed: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  onSelectCategory,
  onSelectTool,
  onOpenVPSGuide,
  recentlyUsed,
  searchQuery,
  setSearchQuery,
  darkMode,
  setDarkMode,
  onGoHome,
}) => {
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);

  const recentTools = TOOLS.filter((t) => recentlyUsed.includes(t.id));

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 z-40 transition-colors">
      
      {/* Brand & Logo */}
      <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={onGoHome}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          DocuShift<span className="text-blue-600 font-black italic underline">.io</span>
        </span>
      </div>

      {/* High Density Search Input Bar */}
      <div className="flex-1 max-w-md mx-4 sm:mx-8 relative hidden sm:block">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for tools (e.g. 'Merge PDF', 'Compress Word')"
            className="w-full pl-10 pr-8 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-none rounded-full text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav Menu Actions */}
      <div className="flex items-center gap-3 sm:gap-5 text-xs font-semibold shrink-0">
        <button
          onClick={() => {
            onSelectCategory('All');
            onGoHome();
          }}
          className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden md:block"
        >
          All Tools
        </button>

        <button
          onClick={() => onSelectTool('compress-pdf')}
          className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden md:block"
        >
          Compress
        </button>

        <button
          onClick={() => onSelectTool('universal-converter')}
          className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden md:block"
        >
          Convert
        </button>

        {/* Recently Used Dropdown */}
        {recentTools.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowRecentDropdown(!showRecentDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden lg:inline">Recent</span>
            </button>

            {showRecentDropdown && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50"
                onMouseLeave={() => setShowRecentDropdown(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 mb-1">
                  Recently Used
                </div>
                {recentTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      onSelectTool(tool.id);
                      setShowRecentDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 flex items-center justify-between"
                  >
                    <span className="truncate">{tool.name}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VPS Hostinger Deploy Guide Button */}
        <button
          onClick={onOpenVPSGuide}
          className="px-3 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors font-bold text-xs flex items-center gap-1.5"
        >
          <Server className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Free Forever</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

      </div>

    </header>
  );
};

