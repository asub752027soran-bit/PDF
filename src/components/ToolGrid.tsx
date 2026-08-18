import React from 'react';
import { ToolCard } from './ToolCard';
import { AdSenseBanner } from './AdSenseBanner';
import { CATEGORIES } from '../data/toolsData';
import { CategoryType, ToolItem } from '../types';
import { FileQuestion, Layers, Sparkles } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface ToolGridProps {
  tools: ToolItem[];
  selectedCategory: CategoryType;
  onSelectCategory: (cat: CategoryType) => void;
  onSelectTool: (toolId: string) => void;
  searchQuery: string;
  disabledTools?: string[];
  customBadges?: Record<string, string>;
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  tools,
  selectedCategory,
  onSelectCategory,
  onSelectTool,
  searchQuery,
  disabledTools = [],
  customBadges = {},
}) => {
  const { t, getCategoryName, getToolName, getToolDescription } = useLanguage();

  // Filter tools by category & search query & disabled tools
  const filteredTools = tools.filter((tItem) => {
    if (disabledTools.includes(tItem.id)) return false;

    const matchesCategory =
      selectedCategory === 'All' || tItem.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const localizedName = getToolName(tItem.id, tItem.name).toLowerCase();
    const localizedDesc = getToolDescription(tItem.id, tItem.description).toLowerCase();

    const matchesSearch =
      tItem.name.toLowerCase().includes(q) ||
      tItem.description.toLowerCase().includes(q) ||
      localizedName.includes(q) ||
      localizedDesc.includes(q) ||
      tItem.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      tItem.supportedFormats.some((fmt) => fmt.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      
      {/* Category Tab Pills (Mobile / Responsive view) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar md:hidden border-b border-slate-200 dark:border-slate-800">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {getCategoryName(cat)}
          </button>
        ))}
      </div>

      {/* Result Header Bar */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {selectedCategory === 'All' ? t('allAvailableTools') : getCategoryName(selectedCategory)}
          </h2>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {filteredTools.length}
          </span>
        </div>

        {searchQuery && (
          <p className="text-xs text-slate-500 italic">
            {t('searchResultPrefix')} "{searchQuery}"
          </p>
        )}
      </div>

      {/* Empty State */}
      {filteredTools.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <FileQuestion className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('noToolsMatch')}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {t('trySearching')}
          </p>
          <button
            onClick={() => onSelectCategory('All')}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
          >
            {t('showAllTools')}
          </button>
        </div>
      ) : (
        <>
          {/* Main High Density Tool Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTools.map((tool) => (
              <React.Fragment key={tool.id}>
                <ToolCard
                  tool={tool}
                  customBadge={customBadges[tool.id]}
                  onSelect={onSelectTool}
                />
              </React.Fragment>
            ))}
          </div>
        </>
      )}

    </div>
  );
};
