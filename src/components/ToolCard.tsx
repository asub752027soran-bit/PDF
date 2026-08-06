import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ToolItem } from '../types';

interface ToolCardProps {
  tool: ToolItem;
  onSelect: (toolId: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  // Dynamically resolve Lucide icon
  const IconComponent = (LucideIcons as any)[tool.iconName] || LucideIcons.File;

  // Determine top border color by category
  const getTopBorderClass = () => {
    switch (tool.category) {
      case 'PDF Tools':
        return 'border-t-red-500';
      case 'Word Tools':
        return 'border-t-blue-500';
      case 'Excel Tools':
        return 'border-t-emerald-500';
      case 'Image Tools':
        return 'border-t-purple-500';
      case 'Compression Tools':
        return 'border-t-amber-500';
      case 'PowerPoint Tools':
        return 'border-t-indigo-500';
      default:
        return 'border-t-cyan-500';
    }
  };

  return (
    <div
      onClick={() => onSelect(tool.id)}
      className={`group p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md transition-all cursor-pointer flex flex-col justify-between border-t-4 ${getTopBorderClass()}`}
    >
      <div>
        {/* Top Header Row with Icon & Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <IconComponent className="w-4 h-4" />
          </div>

          {tool.badge && (
            <span
              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                tool.badge === 'Popular'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                  : tool.badge === 'New'
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300'
                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
              }`}
            >
              {tool.badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm mb-1 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {tool.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight line-clamp-2 mb-3">
          {tool.description}
        </p>
      </div>

      {/* Formats Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex flex-wrap gap-1">
          {tool.supportedFormats.slice(0, 3).map((fmt) => (
            <span
              key={fmt}
              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold"
            >
              {fmt}
            </span>
          ))}
        </div>
        <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
          Open →
        </span>
      </div>

    </div>
  );
};

