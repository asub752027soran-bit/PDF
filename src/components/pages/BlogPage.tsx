import React, { useState } from 'react';
import { BLOG_POSTS } from '../../data/blogData';
import { BlogPost } from '../../types';
import { BookOpen, Clock, Calendar, User, ArrowLeft, Tag, ArrowRight } from 'lucide-react';

interface BlogPageProps {
  onBack: () => void;
  onSelectTool: (toolId: string) => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({ onBack, onSelectTool }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => {
            if (selectedPost) setSelectedPost(null);
            else onBack();
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {selectedPost ? 'Back to All Articles' : 'Back to Home'}
        </button>
        <div className="text-right">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-end">
            <BookOpen className="w-5 h-5 text-indigo-600" /> pdfeditfy.com Knowledge Hub
          </h1>
          <p className="text-xs text-slate-500">
            Expert guides on PDF compression, format conversions, privacy, and office productivity.
          </p>
        </div>
      </div>

      {!selectedPost ? (
        /* Blog Index Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BLOG_POSTS.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTime}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {post.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>Read Full Article</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Blog Post Reader View */
        <article className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          
          <div className="space-y-3 border-b border-slate-100 dark:border-slate-700 pb-6">
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold text-xs">
              {selectedPost.category}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {selectedPost.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-2">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {selectedPost.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {selectedPost.publishedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {selectedPost.readTime}
              </span>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
            {selectedPost.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Related Tool Banner Callout */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 shadow-lg">
            <div>
              <h4 className="font-extrabold text-sm mb-1">Try PDFEditfy Free Tools Now</h4>
              <p className="text-xs text-indigo-100">Zero signup needed. Edit, convert & compress files instantly.</p>
            </div>
            <button
              onClick={() => onSelectTool('compress-pdf')}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-indigo-50 transition-all whitespace-nowrap"
            >
              Launch Compress Tool
            </button>
          </div>

        </article>
      )}

    </div>
  );
};
