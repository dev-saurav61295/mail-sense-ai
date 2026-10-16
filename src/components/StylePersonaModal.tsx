import React, { useState } from 'react';
import { UserStyleProfile } from '../types';
import { X, Sparkles, Sliders, Check, RefreshCw, Wand2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  styleProfile: UserStyleProfile;
  onSaveProfile: (profile: UserStyleProfile) => void;
  onAutoAnalyzeFromSent: () => Promise<void>;
  isAnalyzingSent: boolean;
}

export const StylePersonaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  styleProfile,
  onSaveProfile,
  onAutoAnalyzeFromSent,
  isAnalyzingSent,
}) => {
  const [formData, setFormData] = useState<UserStyleProfile>(styleProfile);
  const [newRule, setNewRule] = useState('');

  React.useEffect(() => {
    setFormData(styleProfile);
  }, [styleProfile]);

  if (!isOpen) return null;

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setFormData((prev) => ({
      ...prev,
      customRules: [...prev.customRules, newRule.trim()],
    }));
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customRules: prev.customRules.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Personal Communication Style & Voice
              </h2>
              <p className="text-[11px] text-slate-500">
                The AI adapts reply suggestions to match your authentic historical writing habits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Quick Auto-Extract Button */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between gap-3">
            <div className="text-xs text-indigo-900">
              <span className="font-semibold">Auto-Tune from Sent Emails:</span>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Inspects recent sent messages to detect your authentic phrasing and greetings.
              </p>
            </div>
            <button
              type="button"
              onClick={onAutoAnalyzeFromSent}
              disabled={isAnalyzingSent}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isAnalyzingSent ? 'animate-spin' : ''}`} />
              <span>{isAnalyzingSent ? 'Analyzing...' : 'Auto-Extract'}</span>
            </button>
          </div>

          {/* Preferred Tone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Communication Tone
            </label>
            <input
              type="text"
              value={formData.tone}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              placeholder="e.g. Professional, direct, collaborative, warm"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Brevity & Formatting */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brevity Preference
              </label>
              <select
                value={formData.brevity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    brevity: e.target.value as 'concise' | 'balanced' | 'thorough',
                  })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="concise">Concise (1–3 sentences)</option>
                <option value="balanced">Balanced (3–5 sentences)</option>
                <option value="thorough">Thorough & Detailed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Signature Name
              </label>
              <input
                type="text"
                value={formData.signatureName}
                onChange={(e) => setFormData({ ...formData, signatureName: e.target.value })}
                placeholder="e.g. Saurav"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Greeting and Signoff */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Typical Greeting
              </label>
              <input
                type="text"
                value={formData.greeting}
                onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                placeholder="Hi {name},"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Typical Sign-off
              </label>
              <input
                type="text"
                value={formData.signoff}
                onChange={(e) => setFormData({ ...formData, signoff: e.target.value })}
                placeholder="Best regards,"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Bullet points toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="bulletToggle"
              checked={formData.useBulletPoints}
              onChange={(e) => setFormData({ ...formData, useBulletPoints: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="bulletToggle" className="text-xs text-slate-700 cursor-pointer font-medium">
              Format multi-step answers or action items with bullet points
            </label>
          </div>

          {/* Custom Stylistic Rules */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Personal Writing Principles & Habits
            </label>
            <div className="space-y-1.5 mb-2">
              {formData.customRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700"
                >
                  <span>{rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="text-slate-400 hover:text-rose-600 transition-colors ml-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="Add custom rule (e.g. 'State decisions in first sentence')..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRule();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddRule}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Add Rule
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Voice Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
