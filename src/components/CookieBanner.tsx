import React, { useState, useEffect } from 'react';
import { Cookie, X, Check } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export const CookieBanner: React.FC = () => {
  const [accepted, setAccepted] = useState(true); // Default true unless unchecked
  const { t } = useLanguage();

  useEffect(() => {
    const consent = localStorage.getItem('pdfeditfy_cookie_consent') || localStorage.getItem('docushift_cookie_consent');
    if (!consent) {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('pdfeditfy_cookie_consent', 'accepted');
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Cookie className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-white">{t('cookieNoticeTitle', 'Cookie & Privacy Notice')}</h4>
          </div>
          <button
            onClick={handleAccept}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          {t('cookieNoticeDesc', 'PDFEditfy uses local browser storage for basic site preferences and complies with Google AdSense and GDPR policies. We do not store your uploaded documents permanently.')}
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> {t('acceptAndContinue', 'Accept & Continue')}
          </button>
        </div>
      </div>
    </div>
  );
};
