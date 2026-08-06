import React from 'react';
import { Info } from 'lucide-react';

interface AdSenseBannerProps {
  slotType: 'leaderboard' | 'rectangle' | 'banner';
  className?: string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ slotType, className = '' }) => {
  let dimensions = 'w-full max-w-4xl h-24'; // default leaderboard
  let label = 'Advertisement Slot (728x90 Leaderboard)';

  if (slotType === 'rectangle') {
    dimensions = 'w-full max-w-[300px] h-[250px] mx-auto';
    label = 'Advertisement Slot (300x250 Medium Rectangle)';
  } else if (slotType === 'banner') {
    dimensions = 'w-full h-20';
    label = 'Advertisement Banner Slot (Responsive)';
  }

  return (
    <div className={`my-6 mx-auto text-center ${className}`}>
      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center justify-center gap-1">
        <span>Advertisement</span>
        <Info className="w-2.5 h-2.5" />
      </div>

      <div
        className={`bg-slate-100/80 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center p-3 text-slate-400 dark:text-slate-500 transition-colors ${dimensions}`}
      >
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Google AdSense Reserved Slot
        </span>
        <span className="text-[10px] font-mono text-slate-400 mt-1">
          {label}
        </span>
      </div>
    </div>
  );
};
