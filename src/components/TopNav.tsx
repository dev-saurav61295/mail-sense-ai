import React from 'react';
import { User } from 'firebase/auth';
import { LogOut, RefreshCw, Zap } from 'lucide-react';

const SYNC_COUNT_OPTIONS = [25, 50, 100];

interface Props {
  user: User | null;
  activeView: 'inbox' | 'trends' | 'metrics';
  setActiveView: (view: 'inbox' | 'trends' | 'metrics') => void;
  onOpenSpeedMode: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSyncGmail: () => void;
  isSyncing: boolean;
  syncCount: number;
  onSyncCountChange: (count: number) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenVoiceStyle?: () => void;
}

export const TopNav: React.FC<Props> = ({
  user,
  activeView,
  setActiveView,
  onOpenSpeedMode,
  onSignIn,
  onSignOut,
  onSyncGmail,
  isSyncing,
  syncCount,
  onSyncCountChange,
  isDemoMode,
  onToggleDemoMode,
  onOpenVoiceStyle,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('inbox');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-indigo-600 transition-colors"
        >
          MailSense AI
        </a>
        <span className="text-[11px] font-mono font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
          Primary Inbox
        </span>
        {isDemoMode && (
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Preview
          </span>
        )}
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <button
          onClick={() => setActiveView('inbox')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeView === 'inbox' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          Primary Triage
        </button>
        <button
          onClick={() => setActiveView('trends')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeView === 'trends' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          Response Trends
        </button>
        <button
          onClick={() => setActiveView('metrics')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeView === 'metrics' ? 'text-indigo-600 font-semibold' : ''
          }`}
        >
          Productivity Metrics
        </button>
        {onOpenVoiceStyle && (
          <button
            onClick={onOpenVoiceStyle}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer text-slate-600"
          >
            Voice Style
          </button>
        )}
        <button
          onClick={onOpenSpeedMode}
          className="text-amber-700 hover:text-amber-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer font-medium"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Speed Mode</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        {user ? (
          <div className="flex items-center gap-3">
            <select
              value={syncCount}
              onChange={(e) => onSyncCountChange(Number(e.target.value))}
              disabled={isSyncing}
              className="px-2 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 border-0 outline-none"
              title="Number of emails to sync"
              aria-label="Number of emails to sync"
            >
              {SYNC_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} emails
                </option>
              ))}
            </select>
            <button
              onClick={onSyncGmail}
              disabled={isSyncing}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Sync latest emails from Gmail"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Gmail'}</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <div className="text-xs font-medium text-slate-800 leading-tight truncate max-w-[140px]">
                  {user.displayName || user.email}
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-md"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleDemoMode}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {isDemoMode ? 'Use Real Gmail' : 'Load Demo Data'}
            </button>

            {/* Official Google Sign In button format */}
            <button
              onClick={onSignIn}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.9c2.28-2.1 3.6-5.2 3.6-9.16z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.09-6.68-4.91H1.21v3.15C3.26 21.46 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.56H1.21C.44 8.09 0 9.99 0 12s.44 3.91 1.21 5.44l4.11-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.54 1.21 6.56l4.11 3.15c.94-2.82 3.58-4.96 6.68-4.96z"
                />
              </svg>
              <span>Connect Gmail</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
