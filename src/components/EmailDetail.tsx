import React, { useState, useEffect, useRef } from 'react';
import {
  EmailItem,
  EmailCategory,
  EmailSeverity,
  SmartReplySuggestion,
  UserStyleProfile,
} from '../types';
import { SmartReplySuggestions } from './SmartReplySuggestions';
import {
  Send,
  FileEdit,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Tag,
  Calendar,
  MessageSquare,
  Wand2,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface Props {
  email: EmailItem;
  userStyle: UserStyleProfile;
  onUpdateAnalysis: (emailId: string, category: EmailCategory, severity: EmailSeverity) => void;
  onRequestSaveDraft: (to: string, subject: string, body: string, threadId: string) => void;
  onRequestSendReply: (to: string, subject: string, body: string, threadId: string) => void;
  onAnalyzeSingle: (email: EmailItem) => void;
  onAcceptSuggestion: (emailId: string, suggestion: SmartReplySuggestion) => void;
  onEditSuggestion: (emailId: string, suggestion: SmartReplySuggestion) => void;
  onRejectSuggestion: (emailId: string, suggestionId: string) => void;
  onRegenerateSmartReplies: (emailId: string) => Promise<void>;
  onOpenStyleConfig: () => void;
  isAnalyzing: boolean;
  isGeneratingReplies: boolean;
}

type ReplyTone = 'professional' | 'concise' | 'friendly' | 'defer' | 'custom';

export const EmailDetail: React.FC<Props> = ({
  email,
  userStyle,
  onUpdateAnalysis,
  onRequestSaveDraft,
  onRequestSendReply,
  onAnalyzeSingle,
  onAcceptSuggestion,
  onEditSuggestion,
  onRejectSuggestion,
  onRegenerateSmartReplies,
  onOpenStyleConfig,
  isAnalyzing,
  isGeneratingReplies,
}) => {
  const [selectedTone, setSelectedTone] = useState<ReplyTone>('professional');
  const [draftContent, setDraftContent] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeAcceptedId, setActiveAcceptedId] = useState<string | null>(null);

  const draftTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync draft text when tone changes or email changes
  useEffect(() => {
    // If there is an accepted smart suggestion, prefer that
    const accepted = email.analysis?.smartSuggestions?.find((s) => s.status === 'accepted');
    if (accepted) {
      setDraftContent(accepted.draftText);
      setActiveAcceptedId(accepted.id);
      return;
    }

    if (email.analysis?.suggestedReplies) {
      if (selectedTone === 'professional') {
        setDraftContent(email.analysis.suggestedReplies.professional || '');
      } else if (selectedTone === 'concise') {
        setDraftContent(email.analysis.suggestedReplies.concise || '');
      } else if (selectedTone === 'friendly') {
        setDraftContent(email.analysis.suggestedReplies.friendly || '');
      } else if (selectedTone === 'defer') {
        setDraftContent(email.analysis.suggestedReplies.defer || '');
      }
    } else {
      setDraftContent('');
    }
  }, [email.id, selectedTone, email.analysis]);

  // Handle Accept suggestion
  const handleAccept = (suggestion: SmartReplySuggestion) => {
    setDraftContent(suggestion.draftText);
    setActiveAcceptedId(suggestion.id);
    onAcceptSuggestion(email.id, suggestion);

    // Scroll to editor
    if (draftTextareaRef.current) {
      draftTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      draftTextareaRef.current.focus();
    }
  };

  // Handle Edit suggestion
  const handleEdit = (suggestion: SmartReplySuggestion) => {
    setDraftContent(suggestion.draftText);
    setActiveAcceptedId(suggestion.id);
    onEditSuggestion(email.id, suggestion);

    if (draftTextareaRef.current) {
      draftTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      draftTextareaRef.current.focus();
    }
  };

  // Handle Reject suggestion
  const handleReject = (suggestionId: string) => {
    onRejectSuggestion(email.id, suggestionId);
  };

  // Quick refinement helpers
  const handleQuickRefine = async (instruction: string) => {
    setIsGeneratingCustom(true);
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: email.subject,
          emailSender: email.from,
          emailBody: draftContent || email.body || email.snippet,
          tone: 'custom',
          customInstruction: `Refine this existing draft reply with the following adjustment: "${instruction}". Keep the core response intact and maintain the user's authentic sign-off.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.replyText) {
          setDraftContent(data.replyText);
          setSelectedTone('custom');
        }
      }
    } catch (e) {
      console.error('Refinement error:', e);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleGenerateCustom = async () => {
    if (!customPrompt.trim()) return;
    setIsGeneratingCustom(true);
    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: email.subject,
          emailSender: email.from,
          emailBody: email.body || email.snippet,
          tone: 'custom',
          customInstruction: customPrompt,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.replyText) {
          setDraftContent(data.replyText);
          setSelectedTone('custom');
        }
      }
    } catch (e) {
      console.error('Custom draft generation error:', e);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleCopy = () => {
    if (!draftContent) return;
    navigator.clipboard.writeText(draftContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const analysis = email.analysis;
  const smartSuggestions = analysis?.smartSuggestions || [];

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Header bar */}
      <div className="p-6 border-b border-slate-200 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-snug">{email.subject}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <span className="font-semibold text-slate-800">{email.fromName || email.from}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-400">&lt;{email.fromEmail || email.from}&gt;</span>
              <span aria-hidden="true">·</span>
              <span>{email.date}</span>
            </div>
          </div>

          {/* Category Override Select */}
          {analysis && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400 font-medium">Category:</span>
              <select
                value={analysis.category}
                onChange={(e) =>
                  onUpdateAnalysis(email.id, e.target.value as EmailCategory, analysis.severity)
                }
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="REPLY_NOW">Reply Now (Urgent)</option>
                <option value="REPLY_LATER">Can Reply Later</option>
                <option value="IGNORE">Ignore / No Action</option>
              </select>
            </div>
          )}
        </div>

        {/* AI Analysis Card */}
        {analysis ? (
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="text-slate-500">Urgency:</span>
                  <span
                    className={`font-mono tabular-nums ${
                      analysis.urgencyScore >= 80
                        ? 'text-rose-600'
                        : analysis.urgencyScore >= 50
                        ? 'text-amber-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {analysis.urgencyScore}/100
                  </span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Severity:</span>
                  <span
                    className={`font-semibold ${
                      analysis.severity === 'CRITICAL'
                        ? 'text-rose-700'
                        : analysis.severity === 'HIGH'
                        ? 'text-amber-700'
                        : analysis.severity === 'MEDIUM'
                        ? 'text-blue-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {analysis.severity}
                  </span>
                </div>
                {analysis.estimatedMinutes > 0 && (
                  <>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>~{analysis.estimatedMinutes} min to resolve</span>
                    </div>
                  </>
                )}
              </div>

              {analysis.deadline && (
                <div className="text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Deadline: {analysis.deadline}</span>
                </div>
              )}
            </div>

            {/* AI Summary */}
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              <span className="text-slate-500 font-normal">Summary: </span>
              {analysis.summary}
            </p>

            {/* Action Items */}
            {analysis.actionItems && analysis.actionItems.length > 0 && (
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Extracted Action Items
                </div>
                <ul className="space-y-1">
                  {analysis.actionItems.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 text-xs">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>This email has not been analyzed by Gemini AI yet.</span>
            </div>
            <button
              onClick={() => onAnalyzeSingle(email)}
              disabled={isAnalyzing}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Now'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content View (Original Email Body) */}
      <div className="p-6 border-b border-slate-200">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Message Content
        </div>
        <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans selection:bg-indigo-100">
          {email.body || email.snippet}
        </div>
      </div>

      {/* FEATURE: Context-Aware Smart Reply Suggestions Widget */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/40">
        <SmartReplySuggestions
          email={email}
          suggestions={smartSuggestions}
          userStyle={userStyle}
          onAcceptSuggestion={handleAccept}
          onEditSuggestion={handleEdit}
          onRejectSuggestion={handleReject}
          onRegenerateSuggestions={() => onRegenerateSmartReplies(email.id)}
          onOpenStyleConfig={onOpenStyleConfig}
          isLoading={isGeneratingReplies}
        />
      </div>

      {/* Primary Reply Draft Editor Section */}
      <div className="p-6 space-y-4 bg-white flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Active Reply Draft
            </h2>
            {activeAcceptedId && (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Applied from Smart Suggestion</span>
              </span>
            )}
          </div>

          {/* Quick Refine Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 mr-1 hidden sm:inline">Quick Adjust:</span>
            <button
              onClick={() => handleQuickRefine('Make it more concise (max 2 sentences)')}
              disabled={isGeneratingCustom || !draftContent.trim()}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
            >
              Shorten
            </button>
            <button
              onClick={() => handleQuickRefine('Make it more formal and executive')}
              disabled={isGeneratingCustom || !draftContent.trim()}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
            >
              Formal
            </button>
            <button
              onClick={() => handleQuickRefine('Add a warm, friendly and encouraging tone')}
              disabled={isGeneratingCustom || !draftContent.trim()}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
            >
              Warmer
            </button>
          </div>
        </div>

        {/* Custom Prompt Instruction Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Type custom instructions (e.g. 'Agree to meet Friday 3pm and ask for agenda')..."
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 focus:bg-white transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGenerateCustom();
            }}
          />
          <button
            onClick={handleGenerateCustom}
            disabled={isGeneratingCustom || !customPrompt.trim()}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Wand2 className={`w-3.5 h-3.5 text-indigo-600 ${isGeneratingCustom ? 'animate-spin' : ''}`} />
            <span>{isGeneratingCustom ? 'Updating...' : 'Apply Prompt'}</span>
          </button>
        </div>

        {/* Live Editable Draft Area */}
        <div className="relative">
          <textarea
            ref={draftTextareaRef}
            rows={7}
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="AI draft reply will appear here..."
            className="w-full p-4 text-xs font-sans text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed shadow-2xs resize-y"
          />
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-md shadow-2xs transition-colors cursor-pointer"
            title="Copy response to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Buttons for Gmail (Save Draft & Send) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400">
            Clicking Save or Send prompts for your explicit confirmation before interacting with Gmail.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                onRequestSaveDraft(
                  email.fromEmail || email.from,
                  email.subject,
                  draftContent,
                  email.threadId
                )
              }
              disabled={!draftContent.trim()}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-2xs"
            >
              <FileEdit className="w-3.5 h-3.5 text-slate-600" />
              <span>Save Draft to Gmail</span>
            </button>

            <button
              onClick={() =>
                onRequestSendReply(
                  email.fromEmail || email.from,
                  email.subject,
                  draftContent,
                  email.threadId
                )
              }
              disabled={!draftContent.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Reply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
