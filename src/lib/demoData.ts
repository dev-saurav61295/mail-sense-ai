import { EmailItem, UserStyleProfile } from '../types';

export const DEFAULT_USER_STYLE: UserStyleProfile = {
  tone: 'Professional, direct, and collaborative',
  brevity: 'concise',
  greeting: 'Hi {name},',
  signoff: 'Best regards,',
  signatureName: 'Saurav',
  useBulletPoints: false,
  customRules: [
    'Directly addresses timelines or blockers in the opening sentence',
    'Maintains executive accountability with calm, solution-oriented phrasing',
    'Avoids passive corporate jargon or repetitive pleasantries',
  ],
};

export const DEMO_EMAILS: EmailItem[] = [
  {
    id: 'demo-msg-001',
    threadId: 'demo-th-001',
    from: 'Marcus Vance <m.vance@apexenterprises.com>',
    fromName: 'Marcus Vance (VP Engineering)',
    fromEmail: 'm.vance@apexenterprises.com',
    to: 'me@work.com',
    subject: 'URGENT: Production API Latency Breach & Client Escalation',
    snippet:
      'We just received an urgent escalation from FinCorp. Latency on checkout endpoint spiked past 1400ms. We need an immediate RCA and hotfix approval by 2:00 PM today.',
    body: `Hi Team,\n\nWe just received a critical escalation from FinCorp regarding API latency on the checkout transaction pipeline spiking past 1,400ms (our SLA threshold is 250ms).\n\nTheir CTO is demanding an immediate Root Cause Analysis and confirmation of the mitigation patch before 2:00 PM today.\n\nCould you please review the attached APM traces and confirm if the database index hotfix is ready to deploy?\n\nMarcus Vance\nVP of Engineering`,
    date: new Date(Date.now() - 1000 * 60 * 24).toLocaleString(),
    timestamp: Date.now() - 1000 * 60 * 24,
    isUnread: true,
    isStarred: true,
    labelIds: ['INBOX', 'UNREAD', 'IMPORTANT'],
    analysis: {
      category: 'REPLY_NOW',
      severity: 'CRITICAL',
      urgencyScore: 98,
      summary: 'Immediate SLA breach escalation from FinCorp requiring hotfix confirmation and RCA by 2:00 PM.',
      actionItems: [
        'Review APM traces for checkout pipeline',
        'Confirm database index hotfix readiness',
        'Provide RCA ETA to VP before 2:00 PM',
      ],
      keyTopics: ['Production Outage', 'SLA Breach', 'Database Hotfix'],
      deadline: 'Today by 2:00 PM',
      estimatedMinutes: 5,
      suggestedReplies: {
        professional:
          'Marcus, acknowledge received. I am actively reviewing the APM traces with the database team now. The index patch has passed staging verification and we are on track to deploy the hotfix before 1:30 PM, well ahead of the 2:00 PM deadline. Full RCA report will follow immediately.',
        concise:
          'On it Marcus. Reviewing APM traces now—hotfix is tested and scheduled for deployment by 1:30 PM. Updates coming shortly.',
        friendly:
          'Hi Marcus, saw the alert and jumped right on it. The staging validation for the index patch just cleared. We will have the hotfix live and the incident notes ready for FinCorp before 2 PM.',
        defer:
          'Received Marcus. The on-call engineering squad is executing the diagnostic run. I will provide a comprehensive status report in 30 minutes.',
      },
      smartSuggestions: [
        {
          id: 'sugg-001-a',
          intentLabel: 'Confirm Hotfix & Commit Timeline',
          patternType: 'AFFIRMATIVE',
          rationale: 'Directly reassures VP and client with a committed deployment time before 2:00 PM.',
          draftText:
            'Hi Marcus,\n\nAcknowledge received. I am actively reviewing the APM traces with the database squad. The index patch has passed staging verification and we are on track to deploy the hotfix to production by 1:30 PM, well ahead of the 2:00 PM deadline.\n\nFull RCA notes will follow immediately.\n\nBest regards,\nSaurav',
          keyPointsCovered: [
            'Staging validation cleared',
            'Deployment scheduled by 1:30 PM',
            'RCA report to follow',
          ],
          status: 'pending',
        },
        {
          id: 'sugg-001-b',
          intentLabel: 'Request FinCorp Session Logs',
          patternType: 'INQUIRY',
          rationale: 'Seeks specific checkout session correlation IDs while engineering prepares the mitigation.',
          draftText:
            'Hi Marcus,\n\nReceived and triaged. We are staging the index patch now. Could you confirm if FinCorp provided any specific session correlation IDs or geographic cluster details from their APM?\n\nWill provide our status update at 1:15 PM.\n\nBest regards,\nSaurav',
          keyPointsCovered: [
            'Correlation IDs requested',
            'Patch staging underway',
            'Next status at 1:15 PM',
          ],
          status: 'pending',
        },
        {
          id: 'sugg-001-c',
          intentLabel: 'Delegate Execution & Post Status',
          patternType: 'DELEGATE',
          rationale: 'Mobilizes the on-call database squad and schedules an executive war room.',
          draftText:
            'Hi Marcus,\n\nI have mobilized the primary database squad and incident leads to execute the index migration. I will monitor deployment progress and lead the RCA write-up for FinCorp by 2:00 PM.\n\nBest regards,\nSaurav',
          keyPointsCovered: [
            'Squad mobilized',
            'Executive monitoring',
            'Committed to 2:00 PM RCA',
          ],
          status: 'pending',
        },
      ],
    },
  },
  {
    id: 'demo-msg-002',
    threadId: 'demo-th-002',
    from: 'Elena Rostova <elena.rostova@legalshield.org>',
    fromName: 'Elena Rostova (Legal Counsel)',
    fromEmail: 'elena.rostova@legalshield.org',
    to: 'me@work.com',
    subject: 'Signature Required: Enterprise Cloud Services Master Agreement',
    snippet:
      'Attached is the final negotiated Master Services Agreement with revised indemnity clauses. Please sign via DocuSign or confirm approval by 5:00 PM.',
    body: `Good morning,\n\nI have incorporated all feedback from the external redline session. The limitation of liability and mutual indemnity clauses have been resolved to our mutual satisfaction.\n\nPlease review and execute the signature packet before 5:00 PM today so we can counter-sign prior to the end of Q3.\n\nBest regards,\nElena Rostova`,
    date: new Date(Date.now() - 1000 * 60 * 75).toLocaleString(),
    timestamp: Date.now() - 1000 * 60 * 75,
    isUnread: true,
    isStarred: false,
    labelIds: ['INBOX', 'UNREAD'],
    analysis: {
      category: 'REPLY_NOW',
      severity: 'HIGH',
      urgencyScore: 89,
      summary: 'Requires contract signature or sign-off approval before 5:00 PM today for Q3 closing.',
      actionItems: ['Verify revised indemnity terms', 'Sign DocuSign packet by 5:00 PM'],
      keyTopics: ['Contract Approval', 'Legal', 'Q3 Deadline'],
      deadline: 'Today by 5:00 PM',
      estimatedMinutes: 4,
      suggestedReplies: {
        professional:
          'Elena, thank you for finalizing the revisions. I have reviewed the indemnity updates and fully approve the agreement. I will execute the DocuSign envelope within the hour.',
        concise:
          'Thanks Elena. Terms look good—I have signed the DocuSign envelope.',
        friendly:
          'Thanks Elena! Great work getting both sides aligned on indemnity. I am hopping in to sign the agreement right now.',
        defer:
          'Hi Elena, received. I have a client briefing until 3 PM and will review and execute the document immediately after.',
      },
      smartSuggestions: [
        {
          id: 'sugg-002-a',
          intentLabel: 'Approve & Confirm Signature Today',
          patternType: 'AFFIRMATIVE',
          rationale: 'Confirms indemnity alignment and commits to signing the DocuSign envelope within 1 hour.',
          draftText:
            'Hi Elena,\n\nThank you for finalizing the revisions. I have reviewed the updated indemnity clauses and fully approve the agreement. I am executing the DocuSign envelope now so we can counter-sign before 5:00 PM today.\n\nBest regards,\nSaurav',
          keyPointsCovered: ['Indemnity approved', 'DocuSign execution in progress', 'Q3 counter-sign target'],
          status: 'pending',
        },
        {
          id: 'sugg-002-b',
          intentLabel: 'Request Brief Clarification on Exhibit B',
          patternType: 'INQUIRY',
          rationale: 'Double checks the service level credit formula before finalizing signature.',
          draftText:
            'Hi Elena,\n\nThanks for the final turn. The indemnity clauses look resolved. Quick check on Exhibit B (Page 14): does the credit cap remain at 10% or did we align on 15%? Once confirmed, I will sign immediately.\n\nBest regards,\nSaurav',
          keyPointsCovered: ['Page 14 Exhibit B query', 'Ready to sign upon confirmation'],
          status: 'pending',
        },
        {
          id: 'sugg-002-c',
          intentLabel: 'Defer Signature to 4:00 PM Window',
          patternType: 'DECLINE',
          rationale: 'Informs legal of a back-to-back client meeting while guaranteeing signature before 5 PM deadline.',
          draftText:
            'Hi Elena,\n\nReceived with thanks. I am in client briefings until 3:30 PM today, but have blocked 4:00 PM to review and execute the signature packet before the 5:00 PM cutoff.\n\nBest regards,\nSaurav',
          keyPointsCovered: ['Client meeting constraint', 'Dedicated 4:00 PM block', 'Before 5:00 PM deadline'],
          status: 'pending',
        },
      ],
    },
  },
  {
    id: 'demo-msg-003',
    threadId: 'demo-th-003',
    from: 'David Chen <d.chen@cloudpulse.io>',
    fromName: 'David Chen',
    fromEmail: 'd.chen@cloudpulse.io',
    to: 'me@work.com',
    subject: 'Can we reschedule our sync to Thursday at 3:30 PM?',
    snippet:
      'Hey, I have a conflict with our 2:00 PM sync on Thursday. Does 3:30 PM or Friday morning work better for you?',
    body: `Hey,\n\nA customer demo just got bumped into our recurring Thursday 2:00 PM sync. Would you be open to moving our sync to 3:30 PM Thursday, or alternatively anytime Friday morning after 10:00 AM?\n\nLet me know what fits your schedule best.\n\nCheers,\nDavid`,
    date: new Date(Date.now() - 1000 * 60 * 120).toLocaleString(),
    timestamp: Date.now() - 1000 * 60 * 120,
    isUnread: false,
    isStarred: false,
    labelIds: ['INBOX'],
    analysis: {
      category: 'REPLY_NOW',
      severity: 'MEDIUM',
      urgencyScore: 72,
      summary: 'Request to reschedule Thursday sync meeting to 3:30 PM or Friday morning.',
      actionItems: ['Pick Thursday 3:30 PM or Friday morning', 'Update calendar invite'],
      keyTopics: ['Calendar', 'Meeting Reschedule'],
      deadline: 'Before Thursday',
      estimatedMinutes: 2,
      suggestedReplies: {
        professional:
          'Hi David, Thursday at 3:30 PM works perfectly for me. I have updated our calendar invitation accordingly. Look forward to speaking then.',
        concise:
          'Thursday 3:30 PM sounds great David. See you then!',
        friendly:
          'Hey David! No problem at all—customer demos always take priority. Thursday at 3:30 PM is great on my end. Talk soon!',
        defer:
          'Hey David, checking my Friday calendar with the product team and will confirm the exact slot later today.',
      },
      smartSuggestions: [
        {
          id: 'sugg-003-a',
          intentLabel: 'Accept Thursday at 3:30 PM',
          patternType: 'AFFIRMATIVE',
          rationale: 'Quickly resolves the calendar conflict by accepting the primary proposed slot.',
          draftText:
            'Hi David,\n\nThursday at 3:30 PM works perfectly on my end. I have shifted the calendar invite accordingly. Good luck with the customer demo!\n\nBest regards,\nSaurav',
          keyPointsCovered: ['Accepted Thursday 3:30 PM', 'Calendar invite updated'],
          status: 'pending',
        },
        {
          id: 'sugg-003-b',
          intentLabel: 'Propose Friday 10:30 AM Instead',
          patternType: 'INQUIRY',
          rationale: 'Selects the Friday morning window for a less congested schedule.',
          draftText:
            'Hi David,\n\nLet’s go with Friday at 10:30 AM instead—that will give us more breathing room after your demo. Sending an updated calendar invite now.\n\nBest regards,\nSaurav',
          keyPointsCovered: ['Friday 10:30 AM chosen', 'Invite being sent'],
          status: 'pending',
        },
        {
          id: 'sugg-003-c',
          intentLabel: 'Handle Async via Shared Doc',
          patternType: 'DECLINE',
          rationale: 'Avoids rescheduling if the agenda can be answered asynchronously.',
          draftText:
            'Hi David,\n\nNo worries on moving the call. If it’s just the sprint blockers, we can also resolve them async in the tracking doc so you can focus on the customer demo. Let me know if you still prefer a live sync.\n\nBest regards,\nSaurav',
          keyPointsCovered: ['Async resolution offered', 'Doc review option'],
          status: 'pending',
        },
      ],
    },
  },
  {
    id: 'demo-msg-004',
    threadId: 'demo-th-004',
    from: 'Sophia Patel <sophia.patel@designcore.com>',
    fromName: 'Sophia Patel',
    fromEmail: 'sophia.patel@designcore.com',
    to: 'me@work.com',
    subject: 'Design System v3.0 Components Draft for Async Review',
    snippet:
      'We finished the initial component tokens and color specs for v3.0. Please take a look when you have free time this week and drop async notes in Figma.',
    body: `Hello everyone,\n\nThe design squad has completed the first pass of the Design System v3.0 specs. We've refined semantic color palettes, touch target metrics, and high-density table states.\n\nNo immediate rush—please review at your convenience before our planning session next Tuesday and leave async comments on the Figma prototype.\n\nSophia`,
    date: new Date(Date.now() - 1000 * 60 * 240).toLocaleString(),
    timestamp: Date.now() - 1000 * 60 * 240,
    isUnread: true,
    isStarred: false,
    labelIds: ['INBOX', 'UNREAD'],
    analysis: {
      category: 'REPLY_LATER',
      severity: 'LOW',
      urgencyScore: 38,
      summary: 'Design System v3.0 draft ready for non-urgent async review before next Tuesday.',
      actionItems: ['Review Figma component specs', 'Leave async feedback before next Tuesday'],
      keyTopics: ['Design System', 'Async Review', 'Figma'],
      deadline: 'Next Tuesday',
      estimatedMinutes: 15,
      suggestedReplies: {
        professional:
          'Hi Sophia, congratulations to the team on completing the v3.0 component tokens. I will thoroughly review the Figma workspace during my Friday design block and leave async comments ahead of Tuesday.',
        concise:
          'Thanks Sophia! Looks exciting—I will review and leave feedback by Friday afternoon.',
        friendly:
          'Hey Sophia, so excited to see v3.0 ready! I’ll carve out some time on Friday to dive through the tokens and share thoughts in Figma.',
        defer:
          'Thanks Sophia. Added to my async review queue for Friday morning.',
      },
    },
  },
  {
    id: 'demo-msg-005',
    threadId: 'demo-th-005',
    from: 'Karthik Rao <k.rao@hypermetrics.ai>',
    fromName: 'Karthik Rao',
    fromEmail: 'k.rao@hypermetrics.ai',
    to: 'me@work.com',
    subject: 'Quarterly User Retention & Churn Analysis Report (PDF attached)',
    snippet:
      'Attached is our comprehensive Q3 Cohort Analysis. Net revenue retention increased to 118%, with churn concentrated in the self-serve tier.',
    body: `Team,\n\nSharing the final Q3 cohort analysis deck. Highlights:\n- Enterprise NRR: 118% (up 4% QoQ)\n- Trial conversion rate: 3.4%\n- Key driver of expansion: API tier usage\n\nLet’s discuss key findings during next week’s executive staff meeting.\n\nBest,\nKarthik`,
    date: new Date(Date.now() - 1000 * 60 * 420).toLocaleString(),
    timestamp: Date.now() - 1000 * 60 * 420,
    isUnread: false,
    isStarred: false,
    labelIds: ['INBOX'],
    analysis: {
      category: 'REPLY_LATER',
      severity: 'LOW',
      urgencyScore: 32,
      summary: 'Q3 Cohort Analysis report for executive staff meeting next week; no prompt reply required.',
      actionItems: ['Read cohort metrics PDF before executive staff meeting'],
      keyTopics: ['Analytics', 'Q3 Cohorts', 'Executive Meeting'],
      deadline: 'Next week',
      estimatedMinutes: 10,
      suggestedReplies: {
        professional:
          'Karthik, thank you for compiling the cohort breakdown. Strong results on enterprise expansion. I will review the slides prior to our executive review next week.',
        concise:
          'Thanks Karthik, reviewing the deck before our staff meeting.',
        friendly:
          'Great numbers on NRR Karthik! Looking forward to discussing the expansion drivers in detail next week.',
        defer:
          'Thanks Karthik. Stashed for reading during executive prep.',
      },
    },
  },
  {
    id: 'demo-msg-006',
    threadId: 'demo-th-006',
    from: 'Rachel Moore <rachel.moore@strata-partners.com>',
    fromName: 'Rachel Moore',
    fromEmail: 'rachel.moore@strata-partners.com',
    to: 'me@work.com',
    subject: 'Partnership Inquiry: Q4 Integration & Shared Case Study',
    snippet:
      'We loved your recent technical blog post on latency optimization. Would your team be open to exploring a joint enterprise integration and customer case study next quarter?',
    body: `Hi Saurav,\n\nI came across your team's recent architecture teardown on API latency and distributed indexes. The technical depth was fantastic.\n\nOur solutions engineering leadership at Strata is interested in exploring a certified integration between our platforms, along with a co-branded case study in Q4.\n\nWould you have 15 minutes next week for an exploratory chat? No pressure if you are head-down on current product releases.\n\nWarmly,\nRachel Moore\nDirector of Strategic Alliances`,
    date: new Date(Date.now() - 1000 * 60 * 600).toLocaleString(),
    timestamp: Date.now() - 1000 * 60 * 600,
    isUnread: false,
    isStarred: false,
    labelIds: ['INBOX', 'CATEGORY_PERSONAL'],
    analysis: {
      category: 'REPLY_LATER',
      severity: 'LOW',
      urgencyScore: 42,
      summary: 'Partnership inquiry regarding joint enterprise integration and co-branded case study for Q4.',
      actionItems: ['Evaluate partnership fit', 'Respond regarding 15-min chat next week'],
      keyTopics: ['Strategic Partnership', 'Case Study', 'Integration'],
      deadline: 'Next week',
      estimatedMinutes: 5,
      suggestedReplies: {
        professional:
          'Hi Rachel, thank you for the thoughtful note and kind feedback on our architecture post. We are interested in exploring integration synergy. I would be glad to connect for 15 minutes next Wednesday afternoon.',
        concise:
          'Thanks Rachel! Glad you enjoyed the post. Let us connect next Wednesday at 2:00 PM.',
        friendly:
          'Hi Rachel, really appreciate you reaching out! The joint case study sounds very promising. Let us grab 15 minutes next week to see where our roadmaps overlap.',
        defer:
          'Hi Rachel, thanks for reaching out. We are currently finalizing our sprint deliverables this week and I will follow up with scheduling options next Tuesday.',
      },
      smartSuggestions: [
        {
          id: 'sugg-006-a',
          intentLabel: 'Accept Exploratory Chat Next Week',
          patternType: 'AFFIRMATIVE',
          rationale: 'Welcomes the strategic partner interest and suggests a concrete discussion slot next Wednesday.',
          draftText:
            'Hi Rachel,\n\nThank you for reaching out and for the kind words on our architecture post. We would be very interested in exploring integration synergy and a joint case study.\n\nI would be happy to connect for 15 minutes next Wednesday afternoon. Does 2:00 PM ET work for you?\n\nBest regards,\nSaurav',
          keyPointsCovered: ['Thank for feedback', 'Confirm interest in partnership', 'Propose next Wednesday 2 PM'],
          status: 'pending',
        },
        {
          id: 'sugg-006-b',
          intentLabel: 'Request Overview Deck First',
          patternType: 'INQUIRY',
          rationale: 'Asks for their integration deck prior to scheduling a call to evaluate technical fit.',
          draftText:
            'Hi Rachel,\n\nThanks for reaching out. Before scheduling a call, could you share a one-pager or deck on the technical integration scope so I can loop in the relevant engineering lead?\n\nBest regards,\nSaurav',
          keyPointsCovered: ['Request integration one-pager', 'Loop in engineering lead'],
          status: 'pending',
        },
        {
          id: 'sugg-006-c',
          intentLabel: 'Politely Defer to Q1 Due to Current Sprint Focus',
          patternType: 'DECLINE',
          rationale: 'Expresses gratitude but defers to Q1 when current product launch roadmap clears.',
          draftText:
            'Hi Rachel,\n\nThank you for the partnership inquiry. Our engineering team is currently fully committed to core Q4 production milestones, so we will not be able to take on new integrations this quarter. Let us reconnect in January to revisit.\n\nBest regards,\nSaurav',
          keyPointsCovered: ['Q4 commitment constraint', 'Defer discussion to January Q1'],
          status: 'pending',
        },
      ],
    },
  },
  {
    id: 'demo-msg-007',
    threadId: 'demo-th-007',
    from: 'Julian Vance <julian.vance@companyinternal.com>',
    fromName: 'Julian Vance (Finance)',
    fromEmail: 'julian.vance@companyinternal.com',
    to: 'me@work.com',
    subject: 'FYI: Reallocation of Q4 developer workstation budget completed',
    snippet:
      'Just a quick confirmation that your requested workstation budget adjustment has been recorded in NetSuite. No further action needed.',
    body: `Hi Saurav,\n\nJust following up to confirm that your departmental request for the engineering workstation hardware refresh ($4,800) has been approved and booked under Cost Center 402.\n\nThe purchase orders have been dispatched directly to procurement. No further response or documentation is required from your side.\n\nBest,\nJulian Vance\nFinance & Accounting`,
    date: new Date(Date.now() - 1000 * 60 * 900).toLocaleString(),
    timestamp: Date.now() - 1000 * 60 * 900,
    isUnread: false,
    isStarred: false,
    labelIds: ['INBOX', 'CATEGORY_PERSONAL'],
    analysis: {
      category: 'IGNORE',
      severity: 'LOW',
      urgencyScore: 12,
      summary: 'Informational confirmation that workstation hardware budget was approved; explicit note that no action is needed.',
      actionItems: [],
      keyTopics: ['Budget Approval', 'Internal Finance', 'Hardware'],
      deadline: null,
      estimatedMinutes: 0,
      suggestedReplies: {
        professional: 'Thank you Julian, appreciate the confirmation.',
        concise: 'Thanks Julian, noted!',
        friendly: 'Thanks Julian, great news!',
        defer: '',
      },
      smartSuggestions: [
        {
          id: 'sugg-007-a',
          intentLabel: 'Quick Acknowledgment & Thanks',
          patternType: 'AFFIRMATIVE',
          rationale: 'Brief polite acknowledgment of the completed internal budget booking.',
          draftText: 'Hi Julian,\n\nThank you for the confirmation and quick turnaround on the purchase order!\n\nBest regards,\nSaurav',
          keyPointsCovered: ['Acknowledge confirmation', 'Thank finance for turnaround'],
          status: 'pending',
        },
      ],
    },
  },
];
