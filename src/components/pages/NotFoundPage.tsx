import React, { useState } from 'react';
import { Search, Home, FileText, ArrowRight, HelpCircle } from 'lucide-react';
import { TOOLS } from '../../data/toolsData';

interface NotFoundPageProps {
  onGoHome: () => void;
  onSelectTool: (toolId: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome, onSelectTool }) => {
  const [search, setSearch] = useState('');

  const popularTools = TOOLS.filter(
    (t) => t.id === 'edit-pdf' || t.id === 'compress-pdf' || t.id === 'merge-pdf' || t.id === 'pdf-to-word'
  );

  const filteredTools = search
    ? TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 6)
    : popularTools;

  return (
    <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold text-2xl shadow-xs">
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Page or Tool Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          The link you followed may have moved or no longer exists. Use our search below to locate any PDF, Word, or image tool on PDF Editfy.
        </p>
      </div>

      {/* Quick Search */}
      <div className="max-w-md mx-auto relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for a PDF tool (e.g. Compress PDF, Merge, Convert)..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
      </div>

      {/* Suggested Tools Grid */}
      <div className="space-y-4 pt-4 text-left">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
          {search ? 'Matching Tools' : 'Popular Tools You Might Need'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
          {filteredTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {tool.name}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 flex items-center justify-center gap-3">
        <button
          onClick={onGoHome}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Home className="w-4 h-4" />
          Back to Homepage
        </button>
      </div>
    </div>
  );
};
