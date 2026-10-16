import React, { useState, useEffect } from 'react';
import { EmailItem, EmailCategory, EmailSeverity } from '../types';
import {
  Zap,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  FileEdit,
  Sparkles,
} from 'lucide-react';

interface Props {
  emails: EmailItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateCategory: (emailId: string, category: EmailCategory, severity: EmailSeverity) => void;
  onRequestSaveDraft: (to: string, subject: string, body: string, threadId: string) => void;
}

export const SpeedTriageModal: React.FC<Props> = ({
  emails,
  isOpen,
  onClose,
  onUpdateCategory,
  onRequestSaveDraft,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter to unread or pending emails
  const queue = emails.filter((e) => e.analysis?.category !== 'IGNORE');
  const activeEmail = queue[currentIndex] || queue[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '1' && activeEmail) {
        onUpdateCategory(activeEmail.id, 'REPLY_NOW', activeEmail.analysis?.severity || 'HIGH');
        handleNext();
      } else if (e.key === '2' && activeEmail) {
        onUpdateCategory(activeEmail.id, 'REPLY_LATER', activeEmail.analysis?.severity || 'LOW');
        handleNext();
      } else if (e.key === '3' && activeEmail) {
        onUpdateCategory(activeEmail.id, 'IGNORE', 'LOW');
        handleNext();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeEmail, currentIndex, queue.length]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide">
              Speed Triage Mode ({currentIndex + 1} of {queue.length})
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
              Hotkeys: [1] Reply Now · [2] Later · [3] Ignore · [&larr;/&rarr;] Nav · [Esc]
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Card Content */}
        {activeEmail ? (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-slate-800">
                  {activeEmail.fromName || activeEmail.from}
                </span>
                <span>{activeEmail.date}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {activeEmail.subject}
              </h3>
            </div>

            {/* AI Summary and Action Items */}
            {activeEmail.analysis && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Urgency:</span>
                    <span className="text-xs font-bold font-mono text-rose-600">
                      {activeEmail.analysis.urgencyScore}/100
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-medium text-slate-600">
                      {activeEmail.analysis.severity}
                    </span>
                  </div>
                  {activeEmail.analysis.deadline && (
                    <span className="text-xs font-medium text-rose-600">
                      Due: {activeEmail.analysis.deadline}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-semibold">AI Summary: </span>
                  {activeEmail.analysis.summary}
                </p>

                {activeEmail.analysis.actionItems.length > 0 && (
                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <span className="font-semibold text-slate-700">Actions: </span>
                    {activeEmail.analysis.actionItems.join(' · ')}
                  </div>
                )}
              </div>
            )}

            {/* Snippet body */}
            <div className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-100 p-4 rounded-xl max-h-48 overflow-y-auto whitespace-pre-wrap font-sans">
              {activeEmail.body || activeEmail.snippet}
            </div>

            {/* Auto Draft Quick Preview */}
            {activeEmail.analysis?.suggestedReplies.concise && (
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-indigo-900">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Recommended Quick Reply:</span>
                  </span>
                  <button
                    onClick={() =>
                      onRequestSaveDraft(
                        activeEmail.fromEmail || activeEmail.from,
                        activeEmail.subject,
                        activeEmail.analysis!.suggestedReplies.concise,
                        activeEmail.threadId
                      )
                    }
                    className="text-xs text-indigo-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileEdit className="w-3 h-3" />
                    <span>Save Draft to Gmail</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 font-mono italic">
                  "{activeEmail.analysis.suggestedReplies.concise}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">Speed Triage Complete!</p>
            <p className="text-xs text-slate-500 mt-1">
              All emails in this queue have been triaged.
            </p>
          </div>
        )}

        {/* Footer Triage Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors disabled:opacity-40"
              title="Previous email (Left arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= queue.length - 1}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors disabled:opacity-40"
              title="Next email (Right arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {activeEmail && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onUpdateCategory(
                    activeEmail.id,
                    'REPLY_NOW',
                    activeEmail.analysis?.severity || 'HIGH'
                  );
                  handleNext();
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>[1] Reply Now</span>
              </button>

              <button
                onClick={() => {
                  onUpdateCategory(
                    activeEmail.id,
                    'REPLY_LATER',
                    activeEmail.analysis?.severity || 'LOW'
                  );
                  handleNext();
                }}
                className="px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>[2] Later</span>
              </button>

              <button
                onClick={() => {
                  onUpdateCategory(activeEmail.id, 'IGNORE', 'LOW');
                  handleNext();
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>[3] Ignore</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
