import React, { useEffect, useMemo, useState } from 'react';
import { ToolCard } from './ToolCard';
import { CATEGORIES } from '../data/toolsData';
import { CategoryType, ToolItem } from '../types';
import { FileQuestion, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { getToolUsageCounts } from '../utils/activityTracker';

interface ToolGridProps {
  tools: ToolItem[];
  selectedCategory: CategoryType;
  onSelectCategory: (cat: CategoryType) => void;
  onSelectTool: (toolId: string) => void;
  searchQuery: string;
  disabledTools?: string[];
  customBadges?: Record<string, string>;
}

type SortMode = 'most-used' | 'default' | 'az';

const BADGE_PRIORITY: Record<string, number> = {
  Popular: 4,
  New: 3,
  Batch: 2,
  Free: 1,
};

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
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>(() => getToolUsageCounts());
  const [sortMode, setSortMode] = useState<SortMode>('most-used');

  useEffect(() => {
    const syncUsage = () => {
      setUsageCounts(getToolUsageCounts());
    };

    syncUsage();
    window.addEventListener('pdfeditfy_stats_updated', syncUsage);
    window.addEventListener('pdfeditfy_action_logged', syncUsage);
    window.addEventListener('storage', syncUsage);

    return () => {
      window.removeEventListener('pdfeditfy_stats_updated', syncUsage);
      window.removeEventListener('pdfeditfy_action_logged', syncUsage);
      window.removeEventListener('storage', syncUsage);
    };
  }, []);

  // Filter tools by category, search query & disabled tools, then arrange dynamically
  const arrangedTools = useMemo(() => {
    const filtered = tools.filter((tItem) => {
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

    if (sortMode === 'default') {
      return filtered;
    }

    if (sortMode === 'az') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Default 'most-used': arrange descending by recorded number of uses, then badge priority & original order
    const originalIndex = new Map<string, number>();
    tools.forEach((item, idx) => originalIndex.set(item.id, idx));

    return [...filtered].sort((a, b) => {
      const countA = usageCounts[a.id] || 0;
      const countB = usageCounts[b.id] || 0;
      if (countB !== countA) {
        return countB - countA;
      }

      const priorityA = BADGE_PRIORITY[customBadges[a.id] || a.badge || ''] || 0;
      const priorityB = BADGE_PRIORITY[customBadges[b.id] || b.badge || ''] || 0;
      if (priorityB !== priorityA) {
        return priorityB - priorityA;
      }

      return (originalIndex.get(a.id) || 0) - (originalIndex.get(b.id) || 0);
    });
  }, [
    tools,
    disabledTools,
    selectedCategory,
    searchQuery,
    sortMode,
    usageCounts,
    customBadges,
    getToolName,
    getToolDescription,
  ]);

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
      <div className="flex flex-wrap items-center justify-between gap-2 py-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {selectedCategory === 'All' ? t('allAvailableTools') : getCategoryName(selectedCategory)}
          </h2>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {arrangedTools.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {searchQuery && (
            <p className="text-xs text-slate-500 italic">
              {t('searchResultPrefix')} "{searchQuery}"
            </p>
          )}

          <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Arrange:</span>
            <select
              aria-label="Arrange tools order"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="most-used">Most Used</option>
              <option value="default">Category Order</option>
              <option value="az">A–Z</option>
            </select>
          </label>
        </div>
      </div>

      {/* Empty State */}
      {arrangedTools.length === 0 ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {arrangedTools.map((tool) => (
            <React.Fragment key={tool.id}>
              <ToolCard
                tool={tool}
                customBadge={customBadges[tool.id]}
                usageCount={usageCounts[tool.id] || 0}
                onSelect={onSelectTool}
              />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
