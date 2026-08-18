import React from 'react';
import { Upload, FileText, Zap, Sparkles } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onQuickSelect: (toolId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ searchQuery, setSearchQuery, onQuickSelect }) => {
  const { t } = useLanguage();

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Launch universal batch converter tool if user drops/selects files directly
      onQuickSelect('universal-converter');
    }
  };

  return (
    <div className="space-y-4 mb-6">
      
      {/* High Density Drag & Drop Area */}
      <div className="h-40 bg-white dark:bg-slate-900 border-2 border-dashed border-blue-300 dark:border-blue-800/80 rounded-2xl flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 dark:from-slate-900 dark:to-slate-900/90 group hover:border-blue-500 transition-colors shrink-0 shadow-xs relative overflow-hidden">
        
        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 z-10">
          <input
            type="file"
            multiple
            onChange={handleFileDrop}
            className="hidden"
          />
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform mb-1 shadow-xs">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              {t('heroTitle')}
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {t('autoDetect')}
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              {t('heroSub')}
            </p>
          </div>
        </label>
      </div>

    </div>
  );
};


