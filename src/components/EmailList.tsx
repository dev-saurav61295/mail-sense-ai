import React from 'react';
import { EmailItem, EmailCategory, TriageTab } from '../types';
import {
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
  Sparkles,
  Star,
  Mail,
  MailOpen,
  ArrowUpDown,
} from 'lucide-react';

interface Props {
  emails: EmailItem[];
  selectedEmailId: string | null;
  onSelectEmail: (email: EmailItem) => void;
  activeTab: TriageTab;
  setActiveTab: (tab: TriageTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onToggleStar: (emailId: string) => void;
  onToggleRead: (emailId: string) => void;
  onBatchAnalyze: () => void;
  isAnalyzingBatch: boolean;
}

export const EmailList: React.FC<Props> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onToggleStar,
  onToggleRead,
  onBatchAnalyze,
  isAnalyzingBatch,
}) => {
  // Counts for tabs
  const replyNowCount = emails.filter((e) => e.analysis?.category === 'REPLY_NOW').length;
  const replyLaterCount = emails.filter((e) => e.analysis?.category === 'REPLY_LATER').length;
  const ignoreCount = emails.filter((e) => e.analysis?.category === 'IGNORE').length;
  const unreadCount = emails.filter((e) => e.isUnread).length;

  // Filter based on activeTab
  const filteredByTab = emails.filter((e) => {
    if (activeTab === 'reply_now') return e.analysis?.category === 'REPLY_NOW';
    if (activeTab === 'reply_later') return e.analysis?.category === 'REPLY_LATER';
    if (activeTab === 'ignore') return e.analysis?.category === 'IGNORE';
    if (activeTab === 'unread') return e.isUnread;
    return true;
  });

  // Filter based on search query
  const filtered = filteredByTab.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.subject.toLowerCase().includes(q) ||
      e.from.toLowerCase().includes(q) ||
      e.snippet.toLowerCase().includes(q) ||
      (e.analysis?.summary && e.analysis.summary.toLowerCase().includes(q))
    );
  });

  // Sort by urgency score descending by default
  const sorted = [...filtered].sort((a, b) => {
    const scoreA = a.analysis?.urgencyScore ?? (a.isUnread ? 50 : 20);
    const scoreB = b.analysis?.urgencyScore ?? (b.isUnread ? 50 : 20);
    return scoreB - scoreA;
  });

  const unanalyzedCount = emails.filter((e) => !e.analysis).length;

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      {/* Top Search & Filter Bar */}
      <div className="p-4 bg-white border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span>Primary Mailbox</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            category:primary · Social & Promos Excluded
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search primary sender, subject, keywords..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {unanalyzedCount > 0 && (
            <button
              onClick={onBatchAnalyze}
              disabled={isAnalyzingBatch}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Run AI triage on unanalyzed primary emails"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAnalyzingBatch ? 'Triaging...' : `Triage AI (${unanalyzedCount})`}</span>
            </button>
          )}
        </div>

        {/* Interactive Segmented Filter Tabs (Zero-pill button compliance) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({emails.length})
          </button>
          <button
            onClick={() => setActiveTab('reply_now')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reply_now'
                ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Reply Now ({replyNowCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('reply_later')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reply_later'
                ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Later ({replyLaterCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('ignore')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ignore'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Ignore ({ignoreCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'unread'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Email List Scrollable Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
        {sorted.length > 0 ? (
          sorted.map((email) => {
            const isSelected = email.id === selectedEmailId;
            const analysis = email.analysis;

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`p-4 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-white ring-1 ring-inset ring-indigo-500 shadow-xs'
                    : 'bg-white/60 hover:bg-white'
                }`}
              >
                {/* Top line: Sender name + Date + Urgency score */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    {email.isUnread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                    <span
                      className={`text-xs truncate ${
                        email.isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                      }`}
                    >
                      {email.fromName || email.from}
                    </span>
                  </div>

                  {analysis && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] font-mono tabular-nums font-semibold ${
                          analysis.urgencyScore >= 80
                            ? 'text-rose-600'
                            : analysis.urgencyScore >= 50
                            ? 'text-amber-600'
                            : 'text-slate-400'
                        }`}
                      >
                        Urgency {analysis.urgencyScore}
                      </span>
                    </div>
                  )}
                </div>

                {/* Subject line */}
                <div
                  className={`text-xs mt-1 truncate ${
                    email.isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'
                  }`}
                >
                  {email.subject}
                </div>

                {/* Snippet / Summary */}
                <div className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {analysis?.summary || email.snippet}
                </div>

                {/* Unboxed Metadata Line with typographic separators (Anti-slop compliance) */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 truncate">
                    {analysis ? (
                      <>
                        <span
                          className={
                            analysis.category === 'REPLY_NOW'
                              ? 'text-rose-600 font-medium'
                              : analysis.category === 'REPLY_LATER'
                              ? 'text-amber-600 font-medium'
                              : 'text-slate-500'
                          }
                        >
                          {analysis.category === 'REPLY_NOW'
                            ? 'Reply Now'
                            : analysis.category === 'REPLY_LATER'
                            ? 'Can Reply Later'
                            : 'Ignore'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{analysis.severity}</span>
                        {analysis.deadline && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-rose-600 truncate">{analysis.deadline}</span>
                          </>
                        )}
                      </>
                    ) : (
                      <span>Unanalyzed</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleRead(email.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded"
                      title={email.isUnread ? 'Mark as read' : 'Mark as unread'}
                    >
                      {email.isUnread ? (
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <MailOpen className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onToggleStar(email.id)}
                      className="p-1 text-slate-400 hover:text-amber-500 transition-colors rounded"
                      title={email.isStarred ? 'Starred' : 'Star message'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          email.isStarred ? 'fill-amber-400 text-amber-500' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-700">No emails match this filter</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Try switching tabs or clearing your search term.
              </p>
            </div>
            {activeTab !== 'all' && (
              <button
                onClick={() => setActiveTab('all')}
                className="px-3 py-1 text-xs text-indigo-600 hover:underline"
              >
                View all emails
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
