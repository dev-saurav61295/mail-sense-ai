import React, { useState } from 'react';
import { SmartReplySuggestion, UserStyleProfile, EmailItem } from '../types';
import {
  Sparkles,
  Check,
  Edit3,
  X,
  RefreshCw,
  Sliders,
  CornerDownRight,
  ThumbsUp,
  HelpCircle,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface Props {
  email: EmailItem;
  suggestions: SmartReplySuggestion[];
  userStyle: UserStyleProfile;
  onAcceptSuggestion: (suggestion: SmartReplySuggestion) => void;
  onEditSuggestion: (suggestion: SmartReplySuggestion) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  onRegenerateSuggestions: () => void;
  onOpenStyleConfig: () => void;
  isLoading: boolean;
}

export const SmartReplySuggestions: React.FC<Props> = ({
  email,
  suggestions,
  userStyle,
  onAcceptSuggestion,
  onEditSuggestion,
  onRejectSuggestion,
  onRegenerateSuggestions,
  onOpenStyleConfig,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<string>(suggestions[0]?.id || '');

  // Keep active tab in sync if suggestions change
  React.useEffect(() => {
    if (suggestions.length > 0 && !suggestions.some((s) => s.id === activeTab)) {
      setActiveTab(suggestions[0].id);
    }
  }, [suggestions, activeTab]);

  const activeSuggestion = suggestions.find((s) => s.id === activeTab) || suggestions[0];

  const getPatternBadge = (type: string) => {
    switch (type) {
      case 'AFFIRMATIVE':
        return {
          label: 'Affirmative & Action',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <ThumbsUp className="w-3 h-3 text-emerald-600" />,
        };
      case 'INQUIRY':
        return {
          label: 'Inquiry & Clarification',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <HelpCircle className="w-3 h-3 text-blue-600" />,
        };
      case 'DECLINE':
      case 'DELEGATE':
        return {
          label: type === 'DECLINE' ? 'Polite Decline / Alternative' : 'Delegation & Status',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock className="w-3 h-3 text-amber-600" />,
        };
      default:
        return {
          label: 'Custom Strategy',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <Sparkles className="w-3 h-3 text-slate-600" />,
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Context-Aware Smart Reply Suggestions
              </h3>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium border border-indigo-100">
                Tuned to Your Style
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Pattern-matched drafts based on incoming intent & your historical voice ({userStyle.tone})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStyleConfig}
            className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
            title="Configure your authentic writing voice and greeting/sign-off rules"
          >
            <Sliders className="w-3 h-3 text-slate-500" />
            <span>Voice Style</span>
          </button>

          <button
            onClick={onRegenerateSuggestions}
            disabled={isLoading}
            className="px-2.5 py-1 text-[11px] font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Generate alternative reply angles"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Generating...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Suggestion Selector Tabs */}
      {suggestions.length > 0 ? (
        <div className="border-b border-slate-100 p-2 bg-slate-50/50 flex gap-1.5 overflow-x-auto">
          {suggestions.map((sugg, idx) => {
            const badge = getPatternBadge(sugg.patternType);
            const isActive = sugg.id === activeTab;
            const isRejected = sugg.status === 'rejected';
            const isAccepted = sugg.status === 'accepted';

            return (
              <button
                key={sugg.id}
                onClick={() => setActiveTab(sugg.id)}
                className={`flex-1 min-w-[160px] text-left p-2.5 rounded-lg border transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-white border-indigo-300 shadow-2xs ring-1 ring-indigo-500/20'
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                } ${isRejected ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mb-1">
                  <span className="flex items-center gap-1">
                    {badge.icon}
                    <span>Option {idx + 1}</span>
                  </span>
                  {isAccepted ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Accepted
                    </span>
                  ) : isRejected ? (
                    <span className="text-rose-500">Rejected</span>
                  ) : (
                    <span className="text-slate-400 capitalize">{sugg.patternType.toLowerCase()}</span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {sugg.intentLabel}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-xs text-slate-500">
            No smart suggestions generated yet. Click below to analyze with your writing persona.
          </p>
          <button
            onClick={onRegenerateSuggestions}
            disabled={isLoading}
            className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Suggestions Now</span>
          </button>
        </div>
      )}

      {/* Active Suggestion Details & Controls */}
      {activeSuggestion && (
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                    getPatternBadge(activeSuggestion.patternType).bg
                  }`}
                >
                  {getPatternBadge(activeSuggestion.patternType).icon}
                  <span>{getPatternBadge(activeSuggestion.patternType).label}</span>
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {activeSuggestion.intentLabel}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <span className="font-medium text-slate-700">Context Rationale: </span>
                {activeSuggestion.rationale}
              </p>
            </div>

            {/* Key Points Addressed */}
            {activeSuggestion.keyPointsCovered?.length > 0 && (
              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1">
                <span className="font-medium text-slate-600">Points addressed:</span>
                {activeSuggestion.keyPointsCovered.map((pt, i) => (
                  <span
                    key={i}
                    className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]"
                  >
                    {pt}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Draft Preview Box */}
          <div className="relative p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Proposed Response Draft</span>
              <span className="font-mono text-[10px] text-slate-400">
                Persona: {userStyle.greeting.replace('{name}', email.fromName.split(' ')[0] || 'there')} ... {userStyle.signoff} {userStyle.signatureName}
              </span>
            </div>
            <div className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
              {activeSuggestion.draftText}
            </div>
          </div>

          {/* Action Row: Accept, Edit, Reject */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {activeSuggestion.status === 'accepted'
                  ? 'Suggestion applied to your active draft editor.'
                  : activeSuggestion.status === 'rejected'
                  ? 'Suggestion rejected and dismissed.'
                  : 'Accept to insert into draft editor, edit to refine, or reject.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Reject button */}
              <button
                onClick={() => onRejectSuggestion(activeSuggestion.id)}
                disabled={activeSuggestion.status === 'rejected'}
                className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                title="Reject this suggestion"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>

              {/* Edit button */}
              <button
                onClick={() => onEditSuggestion(activeSuggestion)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Edit this suggestion in the live draft editor"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>Edit</span>
              </button>

              {/* Accept button */}
              <button
                onClick={() => onAcceptSuggestion(activeSuggestion)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Accept suggestion and load into draft editor"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept Suggestion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
