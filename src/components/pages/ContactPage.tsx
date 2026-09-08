import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, ArrowLeft, MessageSquare, ShieldCheck, Clock, HelpCircle } from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
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
        name: formData.name || 'Anonymous User',
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
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <div className="text-right">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 justify-end">
            <Mail className="w-5 h-5 text-blue-600" /> Contact Support Team
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Have questions, feedback, or need help with file processing? Send us a message.
          </p>
        </div>
      </div>

      {/* Support Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Direct Email Assistance</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Reach out directly: <a href="mailto:support@pdfeditfy.com" className="text-blue-600 font-semibold underline">support@pdfeditfy.com</a> or <a href="mailto:asbsoran@gmail.com" className="text-blue-600 font-semibold underline">asbsoran@gmail.com</a>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>Response Turnaround</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            We typically respond to technical and business inquiries within 24–48 business hours.
          </p>
        </div>
      </div>

      {/* Contact Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        
        {submitted ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Thank You! Your Message Was Received
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              We have received your message. Our engineering team reviews all incoming inquiries and will follow up if requested.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: '', email: '', subject: 'General Question', message: '' });
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white transition-all cursor-pointer"
            >
              Send Another Note
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Your Full Name (Optional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Jane Doe"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Your Email Address (For Response)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. name@example.com"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Inquiry Topic / Category
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="General Question">General Question</option>
                <option value="Bug Report / Tool Issue">Bug Report / Tool Issue</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Privacy or Data Request">Privacy or Data Request</option>
                <option value="Business / Partnership">Business / Partnership Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Detailed Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your question, document issue, or feedback in detail..."
                rows={5}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>We never share or sell your email address. Inquiries are handled confidentially.</span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        )}

      </div>

    </div>
  );
};
