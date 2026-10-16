import React from 'react';
import { ConfirmDialogState } from '../types';
import { AlertTriangle, Send, FileEdit, Trash2, Check, X } from 'lucide-react';

interface Props {
  dialog: ConfirmDialogState;
  onClose: () => void;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<Props> = ({ dialog, onClose, isLoading }) => {
  if (!dialog.isOpen) return null;

  const getIcon = () => {
    switch (dialog.type) {
      case 'send_reply':
        return <Send className="w-5 h-5 text-indigo-600" />;
      case 'save_draft':
        return <FileEdit className="w-5 h-5 text-emerald-600" />;
      case 'trash_email':
        return <Trash2 className="w-5 h-5 text-rose-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{dialog.title}</h3>
              <p className="text-xs text-slate-500">Requires explicit user confirmation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            {dialog.description}
          </p>

          {dialog.recipient && (
            <div className="text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
              <div className="text-slate-500">
                Recipient: <span className="text-slate-900 font-semibold">{dialog.recipient}</span>
              </div>
              {dialog.subject && (
                <div className="text-slate-500 truncate">
                  Subject: <span className="text-slate-900">{dialog.subject}</span>
                </div>
              )}
            </div>
          )}

          {dialog.previewContent && (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1.5">Draft Message Preview:</div>
              <div className="max-h-40 overflow-y-auto p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                {dialog.previewContent}
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This operation interacts directly with your Google Workspace Gmail account.
              Please confirm you want to proceed.
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              await dialog.onConfirm();
            }}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
              dialog.isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isLoading ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{dialog.confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
