export type EmailCategory = 'REPLY_NOW' | 'REPLY_LATER' | 'IGNORE';
export type EmailSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// How the signed-in user relates to an email: TO/MENTIONED need a reply, CC/OTHER are FYI only
export type RecipientRole = 'TO' | 'MENTIONED' | 'CC' | 'OTHER';

export type ReplyPatternType = 'AFFIRMATIVE' | 'INQUIRY' | 'DECLINE' | 'DELEGATE' | 'CUSTOM';

export interface SmartReplySuggestion {
  id: string;
  intentLabel: string; // e.g. "Confirm & Provide Timeline", "Request Clarification", "Polite Deferral"
  patternType: ReplyPatternType;
  rationale: string;
  draftText: string;
  keyPointsCovered: string[];
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
}

export interface UserStyleProfile {
  tone: string; // e.g. "Professional & Direct", "Warm & Collaborative"
  brevity: 'concise' | 'balanced' | 'thorough';
  greeting: string; // e.g. "Hi {name},"
  signoff: string; // e.g. "Best regards,"
  signatureName: string;
  useBulletPoints: boolean;
  customRules: string[];
}

export interface EmailAnalysis {
  category: EmailCategory;
  severity: EmailSeverity;
  urgencyScore: number; // 1-100
  summary: string;
  actionItems: string[];
  keyTopics: string[];
  deadline: string | null;
  estimatedMinutes: number;
  suggestedReplies: {
    professional: string;
    concise: string;
    friendly: string;
    defer: string;
  };
  smartSuggestions?: SmartReplySuggestion[];
  // Recorded when analyzed; saved analyses without recipientRole predate the To/CC rule and are re-run
  recipientRole?: RecipientRole;
  alreadyReplied?: boolean;
}

export interface EmailItem {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  cc?: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  timestamp: number;
  isUnread: boolean;
  isStarred: boolean;
  labelIds: string[];
  alreadyReplied?: boolean; // newest message in the thread was sent by the user
  analysis?: EmailAnalysis;
  isAnalyzing?: boolean;
}

export interface ProductivityMetrics {
  totalEmails: number;
  replyNowCount: number;
  replyLaterCount: number;
  ignoreCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  unreadCount: number;
  avgUrgencyScore: number;
  totalEstimatedMinutes: number;
  inboxHealthScore: number;
  acceptedSuggestionsCount?: number;
  rejectedSuggestionsCount?: number;
  editedSuggestionsCount?: number;
}

export interface AiProductivityInsights {
  inboxHealthScore: number;
  executiveSummary: string;
  keyBottlenecks: string[];
  triageRecommendations: string[];
  peakFocusAdvice: string;
}

export type TriageTab = 'all' | 'reply_now' | 'reply_later' | 'ignore' | 'unread';

export interface ConfirmDialogState {
  isOpen: boolean;
  type: 'send_reply' | 'save_draft' | 'mark_read' | 'trash_email' | 'batch_action';
  title: string;
  description: string;
  recipient?: string;
  subject?: string;
  previewContent?: string;
  confirmLabel: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void> | void;
}
