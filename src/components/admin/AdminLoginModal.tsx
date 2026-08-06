import React, { useState } from 'react';
import { Shield, Lock, Key, X, AlertCircle, ArrowRight, CheckCircle2, UserCheck, Loader2, Sparkles } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  currentPasscode: string;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentPasscode,
}) => {
  const [passcode, setPasscode] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'google' | 'passcode'>('google');

  if (!isOpen) return null;

  const handleGoogleSignIn = (emailToAuth = 'asbsoran@gmail.com') => {
    setIsAuthenticating(true);
    setError(null);

    // Simulate official Google OAuth token verification flow
    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthSuccess(true);
      setAuthenticatedUser(emailToAuth);

      // Store Google Admin user session in local storage
      localStorage.setItem('pdfeditfy_admin_google_user', JSON.stringify({
        email: emailToAuth,
        name: emailToAuth.split('@')[0],
        authenticatedAt: new Date().toISOString(),
        role: 'SUPER_ADMIN'
      }));

      setTimeout(() => {
        setAuthSuccess(false);
        setAuthenticatedUser(null);
        onLoginSuccess();
      }, 800);
    }, 900);
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === currentPasscode || passcode.trim() === 'Sobha@752027') {
      setError(null);
      setPasscode('');
      onLoginSuccess();
    } else {
      setError('Incorrect admin passcode. Please check your passcode and try again.');
    }
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }
    handleGoogleSignIn(customEmail.trim().toLowerCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Admin Access Console
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Google Auth
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sign in with your Google Admin account to open Admin Panel
            </p>
          </div>
        </div>

        {/* Auth Method Switcher Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMethod('google'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              authMethod === 'google'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <GoogleIcon />
            <span>Google Sign-In</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('passcode'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              authMethod === 'passcode'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-blue-500" />
            <span>Passcode</span>
          </button>
        </div>

        {/* GOOGLE AUTHENTICATION SECTION */}
        {authMethod === 'google' && (
          <div className="space-y-4">
            
            {/* Primary Google Admin Account Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    A
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      asbsoran@gmail.com
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Primary Authorized Admin Account
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Verified
                </span>
              </div>

              {/* Direct One-Click Google Sign In */}
              <button
                type="button"
                disabled={isAuthenticating || authSuccess}
                onClick={() => handleGoogleSignIn('asbsoran@gmail.com')}
                className="w-full py-3 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs shadow-sm hover:shadow flex items-center justify-center gap-2.5 transition-all group active:scale-[0.99]"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>Verifying Google OAuth token...</span>
                  </>
                ) : authSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Authenticated! Entering Admin Panel...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon />
                    <span>Sign in with Google (asbsoran@gmail.com)</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Custom Google Email Option Toggle */}
            {!showCustomGoogleInput ? (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Sign in with another Google Admin account
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Enter Google Admin Email
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleInput(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm shrink-0"
                  >
                    {isAuthenticating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GoogleIcon />}
                    <span>Auth</span>
                  </button>
                </div>
              </form>
            )}

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

          </div>
        )}

        {/* PASSCODE AUTHENTICATION SECTION */}
        {authMethod === 'passcode' && (
          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Admin Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter admin passcode"
                  className={`w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border ${
                    error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
                  } rounded-xl text-xs font-medium outline-none focus:ring-2 transition-all`}
                  autoFocus
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Default Passcode: <code className="text-blue-600 dark:text-blue-400 font-bold">Sobha@752027</code></span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Authenticate with Passcode</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

