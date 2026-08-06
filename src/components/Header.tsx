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
  FileText,
  Shield,
  LayoutDashboard,
  Wrench,
  DollarSign,
  Mail,
  Globe,
  Lock,
  Check,
  Languages
} from 'lucide-react';
import { CATEGORIES, TOOLS } from '../data/toolsData';
import { CategoryType } from '../types';
import { LANGUAGES, TRANSLATIONS, LanguageCode } from '../data/translations';

interface HeaderProps {
  currentCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
  onSelectTool: (toolId: string) => void;
  onOpenVPSGuide: () => void;
  onOpenAdmin: (tabId?: string) => void;
  recentlyUsed: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onGoHome: () => void;
  currentLanguage?: LanguageCode;
  onSelectLanguage?: (lang: LanguageCode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  onSelectCategory,
  onSelectTool,
  onOpenVPSGuide,
  onOpenAdmin,
  recentlyUsed,
  searchQuery,
  setSearchQuery,
  darkMode,
  setDarkMode,
  onGoHome,
  currentLanguage: externalLanguage,
  onSelectLanguage: externalOnSelectLanguage,
}) => {
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const [internalLanguage, setInternalLanguage] = useState<LanguageCode>(() => {
    return (localStorage.getItem('pdfeditfy_lang') as LanguageCode) || 'en';
  });

  const activeLang = externalLanguage || internalLanguage;

  const handleLanguageChange = (lang: LanguageCode) => {
    localStorage.setItem('pdfeditfy_lang', lang);
    setInternalLanguage(lang);
    if (externalOnSelectLanguage) {
      externalOnSelectLanguage(lang);
    }
  };

  const t = (key: string): string => {
    return TRANSLATIONS[activeLang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const selectedLangObj = LANGUAGES.find((l) => l.code === activeLang) || LANGUAGES[0];

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
          pdfeditfy<span className="text-blue-600 font-black italic underline">.com</span>
        </span>
      </div>

      {/* High Density Search Input Bar */}
      <div className="flex-1 max-w-md mx-4 sm:mx-8 relative hidden sm:block">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
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
      <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold shrink-0">
        <button
          onClick={() => {
            onSelectCategory('All');
            onGoHome();
          }}
          className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden md:block"
        >
          {t('allTools')}
        </button>

        <button
          onClick={() => onSelectTool('compress-pdf')}
          className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden md:block"
        >
          {t('compress')}
        </button>

        <button
          onClick={() => onSelectTool('universal-converter')}
          className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden md:block"
        >
          {t('convert')}
        </button>

        {/* Recently Used Dropdown */}
        {recentTools.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowRecentDropdown(!showRecentDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden lg:inline">{t('recent')}</span>
            </button>

            {showRecentDropdown && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50"
                onMouseLeave={() => setShowRecentDropdown(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 mb-1">
                  {t('recentlyUsed')}
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
          <span className="hidden xs:inline">{t('freeForever')}</span>
        </button>

        {/* Language Switcher Dropdown Component */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 font-bold text-xs"
            title={t('selectLanguage')}
          >
            <span className="text-sm">{selectedLangObj.flag}</span>
            <span className="uppercase font-extrabold text-[11px]">{selectedLangObj.code}</span>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
          </button>

          {showLangMenu && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1"
              onMouseLeave={() => setShowLangMenu(false)}
            >
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Languages className="w-3 h-3 text-blue-500" />
                <span>{t('selectLanguage')}</span>
              </div>

              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    handleLanguageChange(lang.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    activeLang === lang.code
                      ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-900'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <div>
                      <span className="block leading-tight">{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{lang.name}</span>
                    </div>
                  </div>
                  {activeLang === lang.code && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Single Admin Button & Quick Items Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAdminMenu(!showAdminMenu)}
            className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors flex items-center gap-1.5 font-bold text-xs"
            title="Single Admin Console & Control Modules"
          >
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">{t('admin')}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdminMenu ? 'rotate-180' : ''}`} />
          </button>

          {showAdminMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1"
              onMouseLeave={() => setShowAdminMenu(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {t('itemsUnderAdmin')}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>

              <button
                onClick={() => {
                  onOpenAdmin('overview');
                  setShowAdminMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-bold">{t('overviewHealth')}</div>
                  <div className="text-[10px] text-slate-400">{t('overviewSub')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenAdmin('tools');
                  setShowAdminMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"
              >
                <Wrench className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="font-bold">{t('toolsControl')}</div>
                  <div className="text-[10px] text-slate-400">{t('toolsControlSub')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenAdmin('monetization');
                  setShowAdminMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"
              >
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="font-bold">{t('adsenseSetup')}</div>
                  <div className="text-[10px] text-slate-400">{t('adsenseSub')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenAdmin('inquiries');
                  setShowAdminMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"
              >
                <Mail className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="font-bold">{t('supportInbox')}</div>
                  <div className="text-[10px] text-slate-400">{t('supportInboxSub')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenAdmin('seo');
                  setShowAdminMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"
              >
                <Globe className="w-4 h-4 text-cyan-500" />
                <div>
                  <div className="font-bold">{t('seoMetaConfig')}</div>
                  <div className="text-[10px] text-slate-400">{t('seoMetaSub')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenAdmin('security');
                  setShowAdminMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"
              >
                <Lock className="w-4 h-4 text-red-500" />
                <div>
                  <div className="font-bold">{t('securityPasscode')}</div>
                  <div className="text-[10px] text-slate-400">{t('securitySub')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenAdmin('vps');
                  setShowAdminMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center gap-2.5 transition-colors border border-purple-200 dark:border-purple-800/60"
              >
                <Server className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="font-bold">{t('vpsGuide')}</div>
                  <div className="text-[10px] text-purple-500 dark:text-purple-400">{t('vpsGuideSub')}</div>
                </div>
              </button>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    onOpenAdmin('overview');
                    setShowAdminMenu(false);
                  }}
                  className="w-full py-1.5 text-center text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('openFullAdmin')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={t('toggleTheme')}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

      </div>

    </header>
  );
};

