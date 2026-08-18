import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  LanguageCode,
  LANGUAGES,
  LanguageOption,
  getTranslation,
  translateCategory,
  translateToolName,
  translateToolDescription
} from '../data/translations';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  getCategoryName: (category: string) => string;
  getToolName: (toolId: string, defaultName: string) => string;
  getToolDescription: (toolId: string, defaultDesc: string) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('pdfeditfy_lang') as LanguageCode;
      if (saved && (saved === 'en' || saved === 'es' || saved === 'fr' || saved === 'de')) {
        return saved;
      }
    } catch {}
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    try {
      localStorage.setItem('pdfeditfy_lang', lang);
    } catch {}
    setCurrentLanguageState(lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const t = (key: string, fallback?: string): string => {
    return getTranslation(key, currentLanguage, fallback);
  };

  const getCategoryName = (category: string): string => {
    return translateCategory(category, currentLanguage);
  };

  const getToolName = (toolId: string, defaultName: string): string => {
    return translateToolName(toolId, defaultName, currentLanguage);
  };

  const getToolDescription = (toolId: string, defaultDesc: string): string => {
    return translateToolDescription(toolId, defaultDesc, currentLanguage);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        getCategoryName,
        getToolName,
        getToolDescription,
        languages: LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      currentLanguage: 'en',
      setLanguage: () => {},
      t: (k: string, f?: string) => getTranslation(k, 'en', f),
      getCategoryName: (c: string) => translateCategory(c, 'en'),
      getToolName: (_id: string, def: string) => def,
      getToolDescription: (_id: string, def: string) => def,
      languages: LANGUAGES,
    };
  }
  return context;
};
