import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  EmailItem,
  EmailCategory,
  EmailSeverity,
  TriageTab,
  ConfirmDialogState,
  SmartReplySuggestion,
  UserStyleProfile,
} from './types';
import { auth, initAuth, googleSignIn, logout, getAccessToken, setCachedAccessToken } from './lib/auth';
import {
  AnalysisMap,
  loadAnalyses,
  saveAnalyses,
  loadStyle,
  saveStyle,
  clearUserData,
} from './lib/storage';
import {
  fetchInboxMessages,
  createGmailDraft,
  sendGmailMessage,
  modifyGmailLabels,
  fetchSentMessages,
} from './lib/gmail';
import { DEMO_EMAILS, DEFAULT_USER_STYLE } from './lib/demoData';
import { TopNav } from './components/TopNav';
import { EmailList } from './components/EmailList';
import { EmailDetail } from './components/EmailDetail';
import { MetricsDashboard } from './components/MetricsDashboard';
import { SpeedTriageModal } from './components/SpeedTriageModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { StylePersonaModal } from './components/StylePersonaModal';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [emails, setEmails] = useState<EmailItem[]>(DEMO_EMAILS);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(DEMO_EMAILS[0]?.id || null);

  // User communication style profile
  const [userStyle, setUserStyle] = useState<UserStyleProfile>(DEFAULT_USER_STYLE);

  // True once `emails` holds real Gmail messages (as opposed to the demo set); gates persistence.
  const liveDataRef = useRef(false);
  // Always points at the latest handleSyncGmail so the auth listener (registered once) can call it.
  const syncRef = useRef<() => void>(() => {});

  const updateUserStyle = (style: UserStyleProfile) => {
    setUserStyle(style);
    const uid = auth.currentUser?.uid;
    if (uid) saveStyle(uid, style);
  };
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isAnalyzingSent, setIsAnalyzingSent] = useState(false);
  const [isGeneratingSmartReplies, setIsGeneratingSmartReplies] = useState(false);

  const [activeView, setActiveView] = useState<'inbox' | 'trends' | 'metrics'>('inbox');
  const [activeTab, setActiveTab] = useState<TriageTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSpeedModeOpen, setIsSpeedModeOpen] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(25);
  const [isAnalyzingBatch, setIsAnalyzingBatch] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Mandatory user confirmation dialog state for mutating Workspace operations
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    type: 'send_reply',
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    onConfirm: () => {},
  });
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setIsDemoMode(false);

        // Session restored (e.g. after a hot reload): bring back saved style and re-sync the inbox
        const savedStyle = loadStyle(currentUser.uid);
        if (savedStyle) setUserStyle(savedStyle);
        if (!liveDataRef.current) syncRef.current();
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch real Gmail messages when user connects
  const handleSyncGmail = useCallback(async () => {
    const currentToken = token || getAccessToken();
    if (!currentToken) {
      showToast('Please sign in with Google to sync real Gmail messages.', 'info');
      return;
    }

    setIsSyncing(true);
    try {
      const realMessages = await fetchInboxMessages(currentToken, syncCount);
      if (realMessages.length > 0) {
        // Re-attach AI analysis saved from earlier syncs so only new emails need Gemini
        const uid = auth.currentUser?.uid;
        const saved = uid ? loadAnalyses(uid) : {};
        const withSaved = realMessages.map((m) => (saved[m.id] ? { ...m, analysis: saved[m.id] } : m));

        liveDataRef.current = true;
        setEmails(withSaved);
        setSelectedEmailId(withSaved[0].id);
        setIsDemoMode(false);
        showToast(`Loaded ${withSaved.length} emails from your Gmail inbox.`);

        // Automatically trigger AI batch analysis for unanalyzed real messages
        runBatchAnalysis(withSaved);
      } else {
        showToast('Inbox is clear! No recent messages found in INBOX.', 'info');
      }
    } catch (err: any) {
      console.error('Failed to sync Gmail:', err);
      showToast('Failed to sync Gmail: ' + (err?.message || 'Access error'), 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [token, syncCount]);
  syncRef.current = handleSyncGmail;

  // Persist AI analysis for real emails so it survives reloads and re-syncs
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !liveDataRef.current) return;
    const analyses: AnalysisMap = {};
    for (const e of emails) {
      if (e.analysis) analyses[e.id] = e.analysis;
    }
    if (Object.keys(analyses).length > 0) saveAnalyses(uid, analyses);
  }, [emails]);

  // Run AI batch analysis
  const runBatchAnalysis = async (itemsToAnalyze?: EmailItem[]) => {
    const targetItems = itemsToAnalyze || emails;
    const unanalyzed = targetItems.filter((e) => !e.analysis);

    if (unanalyzed.length === 0) {
      showToast('All emails in view are already analyzed by AI.');
      return;
    }

    setIsAnalyzingBatch(true);
    try {
      const res = await fetch('/api/analyze-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: unanalyzed.slice(0, 15) }),
      });

      if (!res.ok) {
        throw new Error('Batch analysis failed');
      }

      const data = await res.json();
      const analyses = data.analyses || [];

      setEmails((prev) =>
        prev.map((item) => {
          const match = analyses.find((a: any) => a.id === item.id);
          if (match) {
            return {
              ...item,
              analysis: {
                category: match.category as EmailCategory,
                severity: match.severity as EmailSeverity,
                urgencyScore: match.urgencyScore,
                summary: match.summary,
                actionItems: match.actionItems || [],
                keyTopics: match.keyTopics || [],
                deadline: match.deadline || null,
                estimatedMinutes: match.estimatedMinutes || 2,
                suggestedReplies: match.suggestedReplies,
              },
            };
          }
          return item;
        })
      );

      showToast(`AI prioritized and triaged ${analyses.length} incoming emails!`);
    } catch (err: any) {
      console.error('AI Batch Analysis error:', err);
      showToast('AI analysis encountered an error. Please try again.', 'error');
    } finally {
      setIsAnalyzingBatch(false);
    }
  };

  // Sign in
  const handleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setCachedAccessToken(res.accessToken);
        setIsDemoMode(false);
        const savedStyle = loadStyle(res.user.uid);
        if (savedStyle) setUserStyle(savedStyle);
        showToast(`Connected as ${res.user.email}`);

        // Sync real Gmail right away
        setTimeout(() => {
          handleSyncGmail();
        }, 500);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showToast('Sign in failed: ' + (err?.message || 'Check permissions'), 'error');
    }
  };

  // Sign out
  const handleSignOut = async () => {
    // Signing out wipes the locally saved analysis and style profile for this account
    const uid = auth.currentUser?.uid;
    if (uid) clearUserData(uid);
    liveDataRef.current = false;
    await logout();
    setUser(null);
    setToken(null);
    setIsDemoMode(true);
    setEmails(DEMO_EMAILS);
    setSelectedEmailId(DEMO_EMAILS[0]?.id || null);
    showToast('Signed out. Loaded demo dataset for preview.');
  };

  // Toggle demo mode
  const handleToggleDemoMode = () => {
    if (isDemoMode && token) {
      handleSyncGmail();
    } else {
      liveDataRef.current = false;
      setIsDemoMode(true);
      setEmails(DEMO_EMAILS);
      setSelectedEmailId(DEMO_EMAILS[0]?.id || null);
      showToast('Loaded demo dataset.');
    }
  };

  // Selected email
  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || emails[0] || null;

  // Manual category override
  const handleUpdateAnalysis = (
    emailId: string,
    category: EmailCategory,
    severity: EmailSeverity
  ) => {
    setEmails((prev) =>
      prev.map((e) => {
        if (e.id === emailId) {
          return {
            ...e,
            analysis: e.analysis
              ? { ...e.analysis, category, severity }
              : {
                  category,
                  severity,
                  urgencyScore: category === 'REPLY_NOW' ? 85 : category === 'REPLY_LATER' ? 45 : 15,
                  summary: e.snippet,
                  actionItems: [],
                  keyTopics: [],
                  deadline: null,
                  estimatedMinutes: 2,
                  suggestedReplies: {
                    professional: 'Thank you for your email. I have received this and will follow up.',
                    concise: 'Received, thank you.',
                    friendly: 'Thanks so much for reaching out! Will follow up shortly.',
                    defer: 'Acknowledged, reviewing this afternoon.',
                  },
                },
          };
        }
        return e;
      })
    );
  };

  // Toggle star
  const handleToggleStar = (emailId: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isStarred: !e.isStarred } : e))
    );
  };

  // Toggle read
  const handleToggleRead = async (emailId: string) => {
    const target = emails.find((e) => e.id === emailId);
    if (!target) return;
    const newUnread = !target.isUnread;

    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isUnread: newUnread } : e))
    );

    // If connected to real Gmail, sync label change
    if (!isDemoMode && token) {
      try {
        if (newUnread) {
          await modifyGmailLabels(token, emailId, [], ['UNREAD']);
        } else {
          await modifyGmailLabels(token, emailId, ['UNREAD'], []);
        }
      } catch (e) {
        console.error('Failed to sync read status with Gmail:', e);
      }
    }
  };

  // Accept smart reply suggestion
  const handleAcceptSuggestion = (emailId: string, suggestion: SmartReplySuggestion) => {
    setEmails((prev) =>
      prev.map((e) => {
        if (e.id === emailId && e.analysis?.smartSuggestions) {
          const updated = e.analysis.smartSuggestions.map((s) => ({
            ...s,
            status: s.id === suggestion.id ? ('accepted' as const) : ('pending' as const),
          }));
          return {
            ...e,
            analysis: {
              ...e.analysis,
              smartSuggestions: updated,
            },
          };
        }
        return e;
      })
    );
    showToast(`Accepted suggestion: "${suggestion.intentLabel}". Loaded into draft editor.`);
  };

  // Edit smart reply suggestion
  const handleEditSuggestion = (emailId: string, suggestion: SmartReplySuggestion) => {
    setEmails((prev) =>
      prev.map((e) => {
        if (e.id === emailId && e.analysis?.smartSuggestions) {
          const updated = e.analysis.smartSuggestions.map((s) =>
            s.id === suggestion.id ? { ...s, status: 'edited' as const } : s
          );
          return {
            ...e,
            analysis: {
              ...e.analysis,
              smartSuggestions: updated,
            },
          };
        }
        return e;
      })
    );
    showToast(`Loaded "${suggestion.intentLabel}" for editing.`);
  };

  // Reject smart reply suggestion
  const handleRejectSuggestion = (emailId: string, suggestionId: string) => {
    setEmails((prev) =>
      prev.map((e) => {
        if (e.id === emailId && e.analysis?.smartSuggestions) {
          const updated = e.analysis.smartSuggestions.map((s) =>
            s.id === suggestionId ? { ...s, status: 'rejected' as const } : s
          );
          return {
            ...e,
            analysis: {
              ...e.analysis,
              smartSuggestions: updated,
            },
          };
        }
        return e;
      })
    );
    showToast('Suggestion rejected and dismissed. You can click "Regenerate" for new angles.');
  };

  // Regenerate smart replies for an email
  const handleRegenerateSmartReplies = async (emailId: string) => {
    const target = emails.find((e) => e.id === emailId);
    if (!target) return;

    setIsGeneratingSmartReplies(true);
    try {
      const res = await fetch('/api/generate-smart-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: {
            from: target.from,
            subject: target.subject,
            date: target.date,
            body: target.body || target.snippet,
          },
          userStyle,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate suggestions');
      const data = await res.json();
      const newSuggestions: SmartReplySuggestion[] = data.suggestions || [];

      setEmails((prev) =>
        prev.map((e) => {
          if (e.id === emailId) {
            return {
              ...e,
              analysis: e.analysis
                ? { ...e.analysis, smartSuggestions: newSuggestions }
                : {
                    category: 'REPLY_NOW',
                    severity: 'MEDIUM',
                    urgencyScore: 70,
                    summary: target.snippet,
                    actionItems: [],
                    keyTopics: [],
                    deadline: null,
                    estimatedMinutes: 2,
                    suggestedReplies: {
                      professional: newSuggestions[0]?.draftText || '',
                      concise: newSuggestions[1]?.draftText || '',
                      friendly: newSuggestions[0]?.draftText || '',
                      defer: newSuggestions[2]?.draftText || '',
                    },
                    smartSuggestions: newSuggestions,
                  },
            };
          }
          return e;
        })
      );
      showToast('Generated 3 fresh context-aware reply suggestions tuned to your style!');
    } catch (err: any) {
      console.error('Smart reply generation error:', err);
      showToast('Failed to regenerate replies. Please try again.', 'error');
    } finally {
      setIsGeneratingSmartReplies(false);
    }
  };

  // Auto-analyze communication style from historical sent messages
  const handleAutoAnalyzeFromSent = async () => {
    setIsAnalyzingSent(true);
    try {
      let samples: string[] = [];
      const currentToken = token || getAccessToken();
      if (!isDemoMode && currentToken) {
        samples = await fetchSentMessages(currentToken, 6);
      }

      const res = await fetch('/api/analyze-user-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentSamples: samples }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          updateUserStyle({
            tone: data.profile.tone || 'Professional & Collaborative',
            brevity: (data.profile.brevity as any) || 'concise',
            greeting: data.profile.greeting || 'Hi {name},',
            signoff: data.profile.signoff || 'Best regards,',
            signatureName: data.profile.signatureName || user?.displayName?.split(' ')[0] || 'Saurav',
            useBulletPoints: Boolean(data.profile.useBulletPoints),
            customRules: data.profile.customRules || [],
          });
          showToast('Updated your communication profile from historical writing style!');
        }
      }
    } catch (e) {
      console.error('Failed to analyze style:', e);
      showToast('Could not analyze sent messages. Using current profile.', 'error');
    } finally {
      setIsAnalyzingSent(false);
    }
  };

  // Analyze single email
  const handleAnalyzeSingle = async (email: EmailItem) => {
    await runBatchAnalysis([email]);
  };

  // Request Save Draft with mandatory confirmation
  const handleRequestSaveDraft = (
    to: string,
    subject: string,
    body: string,
    threadId: string
  ) => {
    setConfirmDialog({
      isOpen: true,
      type: 'save_draft',
      title: 'Save Draft in Gmail',
      description: `This will create an automated reply draft in your Gmail account for ${to}. You will be able to review or send it anytime from Gmail or this dashboard.`,
      recipient: to,
      subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
      previewContent: body,
      confirmLabel: 'Save Draft to Gmail',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          if (!isDemoMode && token) {
            await createGmailDraft(token, { to, subject, body, threadId });
            showToast('Draft successfully created in your Gmail account!');
          } else {
            showToast('Demo Mode: Draft simulated and saved to local triage queue!');
          }
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          console.error('Draft creation failed:', err);
          showToast('Failed to save draft: ' + (err?.message || 'Error'), 'error');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  // Request Send Reply with mandatory confirmation
  const handleRequestSendReply = (
    to: string,
    subject: string,
    body: string,
    threadId: string
  ) => {
    setConfirmDialog({
      isOpen: true,
      type: 'send_reply',
      title: 'Send Reply via Gmail',
      description: `Are you sure you want to send this reply to ${to}? This message will be sent immediately from your connected Gmail address.`,
      recipient: to,
      subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
      previewContent: body,
      confirmLabel: 'Confirm & Send Email',
      isDestructive: false,
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          if (!isDemoMode && token) {
            await sendGmailMessage(token, { to, subject, body, threadId });
            showToast(`Reply sent successfully to ${to}!`);
          } else {
            showToast(`Demo Mode: Simulated reply sent to ${to}!`);
          }
          // Mark email as read / replied
          setEmails((prev) =>
            prev.map((e) =>
              e.id === selectedEmailId
                ? {
                    ...e,
                    isUnread: false,
                    analysis: e.analysis
                      ? { ...e.analysis, category: 'IGNORE', urgencyScore: 0 }
                      : undefined,
                  }
                : e
            )
          );
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          console.error('Send reply failed:', err);
          showToast('Failed to send email: ' + (err?.message || 'Error'), 'error');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Top Bar Navigation */}
      <TopNav
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenSpeedMode={() => setIsSpeedModeOpen(true)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onSyncGmail={handleSyncGmail}
        isSyncing={isSyncing}
        syncCount={syncCount}
        onSyncCountChange={setSyncCount}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onOpenVoiceStyle={() => setIsStyleModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeView === 'inbox' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 h-full">
            {/* Left Column: Email List */}
            <div className="md:col-span-5 lg:col-span-4 h-full overflow-hidden">
              <EmailList
                emails={emails}
                selectedEmailId={selectedEmailId}
                onSelectEmail={(e) => setSelectedEmailId(e.id)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onToggleStar={handleToggleStar}
                onToggleRead={handleToggleRead}
                onBatchAnalyze={() => runBatchAnalysis()}
                isAnalyzingBatch={isAnalyzingBatch}
              />
            </div>

            {/* Right Column: Detailed View & Automated Replier */}
            <div className="hidden md:block md:col-span-7 lg:col-span-8 h-full overflow-hidden bg-white">
              {selectedEmail ? (
                <EmailDetail
                  email={selectedEmail}
                  userStyle={userStyle}
                  onUpdateAnalysis={handleUpdateAnalysis}
                  onRequestSaveDraft={handleRequestSaveDraft}
                  onRequestSendReply={handleRequestSendReply}
                  onAnalyzeSingle={handleAnalyzeSingle}
                  onAcceptSuggestion={handleAcceptSuggestion}
                  onEditSuggestion={handleEditSuggestion}
                  onRejectSuggestion={handleRejectSuggestion}
                  onRegenerateSmartReplies={handleRegenerateSmartReplies}
                  onOpenStyleConfig={() => setIsStyleModalOpen(true)}
                  isAnalyzing={isAnalyzingBatch}
                  isGeneratingReplies={isGeneratingSmartReplies}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                  <p className="text-sm">Select an email to view AI prioritization and drafts</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <MetricsDashboard
              emails={emails}
              userStyle={userStyle}
              onSelectCategory={(cat) => {
                setActiveTab(cat);
                setActiveView('inbox');
              }}
              onNavigateToInbox={() => setActiveView('inbox')}
              onOpenStyleConfig={() => setIsStyleModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Style Persona Modal */}
      <StylePersonaModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        styleProfile={userStyle}
        onSaveProfile={updateUserStyle}
        onAutoAnalyzeFromSent={handleAutoAnalyzeFromSent}
        isAnalyzingSent={isAnalyzingSent}
      />

      {/* Speed Triage Mode Modal */}
      <SpeedTriageModal
        emails={emails}
        isOpen={isSpeedModeOpen}
        onClose={() => setIsSpeedModeOpen(false)}
        onUpdateCategory={handleUpdateAnalysis}
        onRequestSaveDraft={handleRequestSaveDraft}
      />

      {/* Mandatory User Confirmation Dialog for Mutating Workspace Operations */}
      <ConfirmationModal
        dialog={confirmDialog}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        isLoading={isConfirmLoading}
      />

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
