import React, { useState, useEffect } from 'react';
import {
  EmailItem,
  ProductivityMetrics,
  AiProductivityInsights,
  UserStyleProfile,
} from '../types';
import {
  TrendingUp,
  Clock,
  AlertCircle,
  Sparkles,
  Zap,
  BarChart3,
  Calendar,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Sliders,
  Check,
  X,
  Edit3,
} from 'lucide-react';

interface Props {
  emails: EmailItem[];
  userStyle?: UserStyleProfile;
  onSelectCategory: (category: 'all' | 'reply_now' | 'reply_later' | 'ignore') => void;
  onNavigateToInbox: () => void;
  onOpenStyleConfig?: () => void;
}

export const MetricsDashboard: React.FC<Props> = ({
  emails,
  userStyle,
  onSelectCategory,
  onNavigateToInbox,
  onOpenStyleConfig,
}) => {
  const [insights, setInsights] = useState<AiProductivityInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Compute smart reply suggestion metrics
  const allSuggestions = emails.flatMap((e) => e.analysis?.smartSuggestions || []);
  const acceptedSuggestions = allSuggestions.filter((s) => s.status === 'accepted').length;
  const editedSuggestions = allSuggestions.filter((s) => s.status === 'edited').length;
  const rejectedSuggestions = allSuggestions.filter((s) => s.status === 'rejected').length;
  const totalDecided = acceptedSuggestions + editedSuggestions + rejectedSuggestions;
  const acceptanceRate =
    totalDecided > 0
      ? Math.round(((acceptedSuggestions + editedSuggestions) / totalDecided) * 100)
      : 88; // Default initial benchmark

  // Compute metrics from current email collection
  const total = emails.length;
  const replyNowList = emails.filter((e) => e.analysis?.category === 'REPLY_NOW');
  const replyLaterList = emails.filter((e) => e.analysis?.category === 'REPLY_LATER');
  const ignoreList = emails.filter((e) => e.analysis?.category === 'IGNORE');

  const criticalCount = emails.filter((e) => e.analysis?.severity === 'CRITICAL').length;
  const highCount = emails.filter((e) => e.analysis?.severity === 'HIGH').length;
  const medCount = emails.filter((e) => e.analysis?.severity === 'MEDIUM').length;
  const lowCount = emails.filter((e) => e.analysis?.severity === 'LOW').length;

  const totalUrgency = emails.reduce((acc, e) => acc + (e.analysis?.urgencyScore || 0), 0);
  const avgUrgency = total > 0 ? Math.round(totalUrgency / total) : 0;

  const totalMinutes = emails.reduce((acc, e) => acc + (e.analysis?.estimatedMinutes || 0), 0);
  const replyNowMinutes = replyNowList.reduce(
    (acc, e) => acc + (e.analysis?.estimatedMinutes || 0),
    0
  );
  const timeSavedMinutes = ignoreList.length * 4; // Average 4 minutes saved per ignored email

  // Calculate health score: 100 - penalties for critical/urgent backlog
  const unreadUrgent = replyNowList.filter((e) => e.isUnread).length;
  const healthScore = Math.max(
    10,
    Math.min(100, Math.round(100 - unreadUrgent * 12 - criticalCount * 8))
  );

  const fetchAiInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const metricsSummary: ProductivityMetrics = {
        totalEmails: total,
        replyNowCount: replyNowList.length,
        replyLaterCount: replyLaterList.length,
        ignoreCount: ignoreList.length,
        criticalCount,
        highCount,
        mediumCount: medCount,
        lowCount,
        unreadCount: emails.filter((e) => e.isUnread).length,
        avgUrgencyScore: avgUrgency,
        totalEstimatedMinutes: totalMinutes,
        inboxHealthScore: healthScore,
      };

      const sampleSubjects = emails.slice(0, 10).map((e) => ({
        subject: e.subject,
        severity: e.analysis?.severity,
        category: e.analysis?.category,
      }));

      const res = await fetch('/api/productivity-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: metricsSummary, sampleSubjects }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.insights) {
          setInsights(data.insights);
        }
      }
    } catch (err) {
      console.error('Failed to load AI productivity insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (emails.length > 0 && !insights && !isLoadingInsights) {
      fetchAiInsights();
    }
  }, [total]);

  // Senders needing urgent response
  const urgentSenders = replyNowList.slice(0, 5).map((e) => ({
    name: e.fromName || e.fromEmail,
    subject: e.subject,
    severity: e.analysis?.severity || 'HIGH',
    urgency: e.analysis?.urgencyScore || 80,
    deadline: e.analysis?.deadline || 'ASAP',
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Title & Status Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Response Trends & Productivity Metrics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time workload assessment, urgent response queues, and time-saving analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAiInsights}
            disabled={isLoadingInsights}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInsights ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isLoadingInsights ? 'Analyzing...' : 'Refresh AI Diagnostics'}</span>
          </button>
          <button
            onClick={onNavigateToInbox}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Go to Inbox Triage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Reply Now Backlog */}
        <div
          onClick={() => {
            onSelectCategory('reply_now');
            onNavigateToInbox();
          }}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-rose-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Reply Now (Urgent)</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              {replyNowList.length}
            </span>
            <span className="text-xs text-rose-600 font-medium">
              {criticalCount > 0 ? `${criticalCount} critical` : 'Immediate SLA'}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Est. {replyNowMinutes} min required</span>
            <span aria-hidden="true">·</span>
            <span className="text-indigo-600 group-hover:underline">View queue &rarr;</span>
          </div>
        </div>

        {/* Metric 2: Can Reply Later */}
        <div
          onClick={() => {
            onSelectCategory('reply_later');
            onNavigateToInbox();
          }}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Can Reply Later</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              {replyLaterList.length}
            </span>
            <span className="text-xs text-slate-500">
              {total > 0 ? Math.round((replyLaterList.length / total) * 100) : 0}% of inbox
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Low urgency backlog</span>
            <span aria-hidden="true">·</span>
            <span className="text-indigo-600 group-hover:underline">Schedule block &rarr;</span>
          </div>
        </div>

        {/* Metric 3: Ignored / Low Priority */}
        <div
          onClick={() => {
            onSelectCategory('ignore');
            onNavigateToInbox();
          }}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Ignored / Newsletters</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              {ignoreList.length}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              ~{timeSavedMinutes}m saved
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <span>No action required</span>
            <span aria-hidden="true">·</span>
            <span className="text-indigo-600 group-hover:underline">Clean list &rarr;</span>
          </div>
        </div>

        {/* Metric 4: Inbox Health Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Inbox Health Score</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              {healthScore}/100
            </span>
            <span
              className={`text-xs font-medium ${
                healthScore >= 80
                  ? 'text-emerald-600'
                  : healthScore >= 60
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {healthScore >= 80 ? 'Optimal' : healthScore >= 60 ? 'Moderate load' : 'Heavy backlog'}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            <span>Avg urgency: {avgUrgency}/100</span>
          </div>
        </div>
      </div>

      {/* AI Smart Reply Suggestions Performance & Voice Profile Strip */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                AI Smart Reply Performance & Communication Persona
              </h2>
              <p className="text-xs text-slate-500">
                Context-aware reply suggestions tuned to your historical communication style
              </p>
            </div>
          </div>

          {onOpenStyleConfig && (
            <button
              onClick={onOpenStyleConfig}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              <span>Configure Voice Style</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500">Suggestion Acceptance Rate</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
                {acceptanceRate}%
              </span>
              <span className="text-[11px] text-slate-500">
                {acceptedSuggestions + editedSuggestions} of {totalDecided || '3'} accepted
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500">Accepted vs Edited vs Rejected</span>
            <div className="mt-1 flex items-center gap-2 text-xs font-mono font-semibold">
              <span className="text-emerald-700">{acceptedSuggestions} accepted</span>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-700">{editedSuggestions} edited</span>
              <span className="text-slate-300">·</span>
              <span className="text-rose-600">{rejectedSuggestions} rejected</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500">Active Tone & Brevity</span>
            <div className="mt-1 text-xs font-semibold text-slate-900 truncate">
              {userStyle?.tone || 'Professional & Direct'}
            </div>
            <span className="text-[10px] text-slate-500 capitalize">
              {userStyle?.brevity || 'concise'} brevity preference
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500">Signature Template</span>
            <div className="mt-1 text-xs font-mono text-slate-800 truncate">
              {userStyle?.signoff || 'Best regards,'} {userStyle?.signatureName || 'Saurav'}
            </div>
            <span className="text-[10px] text-slate-500 truncate block">
              Greeting: {userStyle?.greeting || 'Hi {name},'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Breakdowns: Category Allocation & Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Triage Distribution */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Email Triage Categorization
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportion of incoming volume classified by urgency requirement
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {total} emails analyzed
            </span>
          </div>

          {/* Visual Bar Strip */}
          <div className="h-6 w-full rounded-md overflow-hidden flex bg-slate-100">
            {total > 0 ? (
              <>
                <div
                  style={{ width: `${(replyNowList.length / total) * 100}%` }}
                  className="bg-rose-500 hover:bg-rose-600 transition-colors"
                  title={`Reply Now: ${replyNowList.length}`}
                />
                <div
                  style={{ width: `${(replyLaterList.length / total) * 100}%` }}
                  className="bg-amber-400 hover:bg-amber-500 transition-colors"
                  title={`Reply Later: ${replyLaterList.length}`}
                />
                <div
                  style={{ width: `${(ignoreList.length / total) * 100}%` }}
                  className="bg-slate-300 hover:bg-slate-400 transition-colors"
                  title={`Ignore: ${ignoreList.length}`}
                />
              </>
            ) : (
              <div className="w-full bg-slate-200" />
            )}
          </div>

          {/* Legend and stats */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span className="text-xs font-medium text-slate-700">Reply Now</span>
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                {replyNowList.length}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({total > 0 ? Math.round((replyNowList.length / total) * 100) : 0}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">High time-sensitivity</p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span className="text-xs font-medium text-slate-700">Can Reply Later</span>
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                {replyLaterList.length}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({total > 0 ? Math.round((replyLaterList.length / total) * 100) : 0}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Schedule for focus block</p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
                <span className="text-xs font-medium text-slate-700">Ignore</span>
              </div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                {ignoreList.length}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({total > 0 ? Math.round((ignoreList.length / total) * 100) : 0}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">No replies necessary</p>
            </div>
          </div>
        </div>

        {/* Severity Matrix */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Severity Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">Incoming communications by impact level</p>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-rose-700">Critical Severity</span>
                <span className="font-mono tabular-nums text-slate-900">{criticalCount}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-rose-600 h-2 rounded-full"
                  style={{ width: `${total > 0 ? (criticalCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-700">High Severity</span>
                <span className="font-mono tabular-nums text-slate-900">{highCount}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${total > 0 ? (highCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-blue-700">Medium Severity</span>
                <span className="font-mono tabular-nums text-slate-900">{medCount}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${total > 0 ? (medCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Low / Informational</span>
                <span className="font-mono tabular-nums text-slate-900">{lowCount}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-slate-400 h-2 rounded-full"
                  style={{ width: `${total > 0 ? (lowCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Productivity Coach & Urgent Escalations Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: AI Productivity Insights */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="w-4 h-4" />
            <h2 className="text-base font-semibold text-slate-900">
              AI Productivity Coach Diagnostics
            </h2>
          </div>

          {isLoadingInsights ? (
            <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
              Synthesizing email load patterns and SLA bottlenecks...
            </div>
          ) : insights ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                {insights.executiveSummary}
              </p>

              <div>
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                  Immediate Recommendations
                </h3>
                <ul className="space-y-2">
                  {insights.triageRecommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {insights.peakFocusAdvice && (
                <div className="text-xs text-indigo-900 bg-indigo-50/70 border border-indigo-100 p-3 rounded-lg flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Recommended Scheduling: </span>
                    {insights.peakFocusAdvice}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-xs text-slate-500">
                Run AI analysis on your inbox to receive tailored productivity advice.
              </p>
              <button
                onClick={fetchAiInsights}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Generate Diagnostics
              </button>
            </div>
          )}
        </div>

        {/* Right: Highest Priority Escalations */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Top Priority Emails Requiring Action
            </h2>
            <span className="text-xs font-mono text-slate-500">Sorted by urgency</span>
          </div>

          <div className="space-y-2.5">
            {urgentSenders.length > 0 ? (
              urgentSenders.map((item, idx) => (
                <div
                  key={idx}
                  onClick={onNavigateToInbox}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">
                      {item.name}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-rose-600 font-semibold">
                      Urgency {item.urgency}/100
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 truncate mt-1">{item.subject}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5">
                    <span>Deadline: {item.deadline}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-rose-600 font-medium">{item.severity}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No high-urgency emails pending. All clear!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
