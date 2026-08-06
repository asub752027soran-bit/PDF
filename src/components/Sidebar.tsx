import React from 'react';
import { CATEGORIES, TOOLS } from '../data/toolsData';
import { CategoryType } from '../types';
import { FileText, Shield, Sparkles, Clock, Layers, Lock, Zap } from 'lucide-react';

interface SidebarProps {
  currentCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
  recentlyUsed: string[];
  onSelectTool: (toolId: string) => void;
  onOpenPage?: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentCategory,
  onSelectCategory,
  recentlyUsed,
  onSelectTool,
  onOpenPage,
}) => {
  const recentTools = TOOLS.filter((t) => recentlyUsed.includes(t.id));

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 overflow-y-auto hidden md:block select-none">
      
      {/* Recently Used Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Recently Used
          </p>
        </div>
        
        {recentTools.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-600 italic px-2">
            No recently used tools yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {recentTools.slice(0, 4).map((tool, idx) => (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all border ${
                  idx === 0
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60 shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                  <span className="truncate">{tool.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tool Categories Navigation */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          Categories
        </p>
        
        <nav className="space-y-1">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* High Density Privacy Promise Card */}
      <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
          <Lock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          Privacy Promise:
        </p>
        <p className="text-[11px] leading-relaxed italic text-slate-500 dark:text-slate-400">
          All files are processed locally or deleted instantly after download. No accounts required.
        </p>
      </div>

    </aside>
  );
};
