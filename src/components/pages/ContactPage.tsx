import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, ArrowLeft, MessageSquare, ShieldCheck } from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    subject: 'General Question',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    // Save inquiry to localStorage for Admin Panel
    try {
      const existing = JSON.parse(localStorage.getItem('pdfeditfy_contacts') || '[]');
      const newInquiry = {
        id: 'inq_' + Date.now(),
        email: formData.email || 'anonymous@user.com',
        subject: formData.subject,
        message: formData.message,
        date: new Date().toLocaleString(),
        status: 'unread',
      };
      localStorage.setItem('pdfeditfy_contacts', JSON.stringify([newInquiry, ...existing]));
    } catch {
      // ignore
    }

    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <div className="text-right">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-end">
            <Mail className="w-5 h-5 text-indigo-600" /> Contact Support Team
          </h1>
          <p className="text-xs text-slate-500">
            Have questions, feedback, or need help with file processing? Send us a message.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Thank You for Contacting pdfeditfy.com!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your inquiry has been received. Our support team responds to user inquiries within 24 hours.
            </p>
            <button
              onClick={() => {
                setFormData({ email: '', subject: 'General Question', message: '' });
                setSubmitted(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              >
                <option>General Question</option>
                <option>Feature Request / New Tool Idea</option>
                <option>Bug Report / File Processing Issue</option>
                <option>Privacy & Security Concern</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Message
              </label>
              <textarea
                rows={5}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your question or feedback..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        )}

      </div>

    </div>
  );
};
