import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini AI instance using modern @google/genai SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Robust model caller with automatic retry & fallback on transient 503/capacity spikes
async function generateWithFallback(params: Omit<Parameters<typeof ai.models.generateContent>[0], 'model'>) {
  const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      return await ai.models.generateContent({
        ...params,
        model,
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} unavailable (${err?.message || 'error'}), trying fallback...`);
    }
  }
  throw lastError;
}

interface EmailToAnalyze {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  bodySnippet?: string;
  date?: string;
  recipientRole?: 'TO' | 'MENTIONED' | 'CC' | 'OTHER';
}

// Endpoint 1: Batch Analyze Emails for urgency, severity, category, and automated reply drafts
app.post('/api/analyze-batch', async (req, res) => {
  try {
    const { emails } = req.body as { emails: EmailToAnalyze[] };

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'No emails provided for analysis.' });
    }

    // Limit batch size to protect token limits
    const batch = emails.slice(0, 15);

    const emailPayloadString = JSON.stringify(
      batch.map((e) => ({
        id: e.id,
        from: e.from,
        subject: e.subject || '(No Subject)',
        date: e.date,
        yourRole: e.recipientRole || 'TO',
        snippet: (e.bodySnippet || e.snippet || '').slice(0, 1500),
      })),
      null,
      2
    );

    const prompt = `You are an expert executive email triage intelligence assistant.
Each email has a "yourRole": TO (addressed to the user), MENTIONED (user is named in the body), CC (user is only copied), or OTHER (indirect recipient).
If yourRole is CC or OTHER, the category MUST be "IGNORE": it is FYI and the user is not expected to reply.
Analyze each incoming email below. For each email:
1. Categorize it into EXACTLY one of:
   - "REPLY_NOW": Urgent, time-sensitive (deadline in <24h), client/executive request, critical blocker, direct question requiring immediate decision.
   - "REPLY_LATER": Important but not urgent (deadlines >24h, reading updates requiring review, discussion items, general coordination).
   - "IGNORE": Newsletters, automated marketing, system transactional notices, receipts, cold sales pitches, social media alerts requiring NO response.
2. Determine severity: "CRITICAL", "HIGH", "MEDIUM", or "LOW".
3. Assign an urgencyScore: integer from 1 to 100 (100 = absolute top urgency).
4. Extract a 1-sentence crisp summary of what the sender wants.
5. Extract actionItems (concrete tasks or decisions required, max 3).
6. Extract keyTopics (1 to 3 short tags like "Billing", "Meeting", "Project Alpha", "Deployment").
7. Extract deadline (e.g. "Today 5 PM", "Tomorrow noon", "Oct 18", or null if none mentioned).
8. Estimate response time needed (estimatedMinutes: 1, 2, 5, 10, 15, or 30).
9. Draft automated response options:
   - professional: Formal, courteous, clear executive reply.
   - concise: Quick, punchy 1-2 sentence response confirming receipt or immediate answer.
   - friendly: Warm, engaging conversational reply.
   - defer: Polite message letting them know you received this and will follow up by a specific time.

Emails to analyze:
${emailPayloadString}`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'List of analyzed emails',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: {
                type: Type.STRING,
                description: 'Must be REPLY_NOW, REPLY_LATER, or IGNORE',
              },
              severity: {
                type: Type.STRING,
                description: 'Must be CRITICAL, HIGH, MEDIUM, or LOW',
              },
              urgencyScore: { type: Type.INTEGER, description: '1 to 100' },
              summary: { type: Type.STRING, description: '1-sentence summary' },
              actionItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              keyTopics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              deadline: {
                type: Type.STRING,
                description: 'Detected deadline or empty string if none',
              },
              estimatedMinutes: { type: Type.INTEGER },
              suggestedReplies: {
                type: Type.OBJECT,
                properties: {
                  professional: { type: Type.STRING },
                  concise: { type: Type.STRING },
                  friendly: { type: Type.STRING },
                  defer: { type: Type.STRING },
                },
                required: ['professional', 'concise', 'friendly', 'defer'],
              },
            },
            required: [
              'id',
              'category',
              'severity',
              'urgencyScore',
              'summary',
              'actionItems',
              'keyTopics',
              'estimatedMinutes',
              'suggestedReplies',
            ],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return res.json({ analyses: parsed });
  } catch (error: any) {
    console.error('Error analyzing batch emails:', error);
    return res.status(500).json({
      error: 'Failed to analyze emails with AI: ' + (error?.message || 'Unknown error'),
    });
  }
});

// Endpoint 2: Generate or refine a custom draft reply
app.post('/api/generate-reply', async (req, res) => {
  try {
    const { emailSubject, emailSender, emailBody, tone, customInstruction } = req.body;

    const prompt = `You are an executive email communication assistant.
Original Email Details:
- From: ${emailSender || 'Unknown'}
- Subject: ${emailSubject || 'No Subject'}
- Content:
${(emailBody || '').slice(0, 2000)}

User's requested tone: ${tone || 'professional'}
Additional guidance/instructions from user:
${customInstruction || 'Write a well-crafted, courteous, complete response addressing all questions or requests.'}

Write the email reply body now. Do not include subject line or greetings like "Dear user" if generic; use the sender's first name if identifiable. Keep it polished and ready to send.`;

    const response = await generateWithFallback({
      contents: prompt,
    });

    return res.json({ replyText: response.text?.trim() || '' });
  } catch (error: any) {
    console.error('Error generating custom reply:', error);
    return res.status(500).json({
      error: 'Failed to generate reply draft: ' + (error?.message || 'Unknown error'),
    });
  }
});

// Endpoint 3: Executive Productivity Insights & Inbox Health Analysis
app.post('/api/productivity-insights', async (req, res) => {
  try {
    const { metrics, sampleSubjects } = req.body;

    const prompt = `You are a productivity coach and executive communications analyst.
Evaluate this user's current Gmail triage state and email habits based on these metrics:
${JSON.stringify(metrics, null, 2)}
Sample recent email subjects:
${JSON.stringify(sampleSubjects || [], null, 2)}

Provide actionable executive productivity diagnostics:
1. inboxHealthScore: Integer between 0 and 100 based on backlog, urgent pending ratio, and processing efficiency.
2. executiveSummary: 2-3 sentences summarizing their current email health and cognitive load.
3. keyBottlenecks: 2-3 specific risks (e.g. "3 critical vendor emails unaddressed", "High ratio of reply-later emails accumulating").
4. triageRecommendations: 3-4 concrete tips to reach inbox zero / maintain quick SLA today.
5. peakFocusAdvice: 1 sentence recommendation on scheduling an email processing block.`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            inboxHealthScore: { type: Type.INTEGER },
            executiveSummary: { type: Type.STRING },
            keyBottlenecks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            triageRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            peakFocusAdvice: { type: Type.STRING },
          },
          required: [
            'inboxHealthScore',
            'executiveSummary',
            'keyBottlenecks',
            'triageRecommendations',
            'peakFocusAdvice',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ insights: parsed });
  } catch (error: any) {
    console.error('Error generating productivity insights:', error);
    return res.status(500).json({
      error: 'Failed to generate productivity insights: ' + (error?.message || 'Unknown error'),
    });
  }
});

// Endpoint 4: Context-Aware Smart Reply Suggestions based on user communication style
app.post('/api/generate-smart-replies', async (req, res) => {
  try {
    const { email, userStyle, senderHistory } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email details' });
    }

    const styleInstructions = userStyle
      ? `
USER'S HISTORICAL COMMUNICATION STYLE PROFILE:
- Preferred Tone: ${userStyle.tone || 'Professional, concise, and direct'}
- Brevity Preference: ${userStyle.brevity || 'concise (2-3 sentences)'}
- Greeting Style: ${userStyle.greeting || 'Hi [Name],'}
- Sign-off Style: ${userStyle.signoff || 'Best regards,'}
- Signer Name: ${userStyle.signatureName || ''}
- Bullet points: ${userStyle.useBulletPoints ? 'Use bullet points for multiple action items or dates' : 'Keep as conversational paragraph'}
- Style Rules: ${(userStyle.customRules || []).join('; ')}
`
      : 'User prefers a crisp, courteous, professional executive communication style.';

    const prompt = `You are an expert AI executive communications assistant.
Analyze this incoming email carefully and generate 3 distinct, highly context-aware smart reply options.

INCOMING EMAIL:
- From: ${email.from || 'Unknown'}
- Subject: ${email.subject || '(No Subject)'}
- Date: ${email.date || 'Recent'}
- Content:
${(email.body || email.snippet || '').slice(0, 2500)}

${styleInstructions}

Generate 3 context-aware reply suggestions covering the most common reply patterns:
1. Pattern 1 (AFFIRMATIVE): Positive resolution, direct agreement, acceptance, or confirmation of request/meeting with concrete next steps.
2. Pattern 2 (INQUIRY): Collaborative clarification, requesting additional details, asking key questions, or suggesting a refinement before deciding.
3. Pattern 3 (DECLINE or DELEGATE): Courteous decline, alternative proposal, referral, or polite deferral with clear justification.

Requirements for each suggestion:
- intentLabel: 2-5 words explaining the strategic intent (e.g. "Confirm Timeline & Accept", "Request Spec Details", "Polite Decline & Alternative").
- patternType: Exactly one of "AFFIRMATIVE", "INQUIRY", "DECLINE", "DELEGATE".
- rationale: 1 brief sentence explaining why this reply is contextually appropriate.
- draftText: Complete, polished reply ready to send. Follow the user's greeting, tone, brevity, sign-off, and signature format faithfully.
- keyPointsCovered: Array of 1-3 specific points addressed from the original email.`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: '3 context-aware reply suggestions',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              intentLabel: { type: Type.STRING },
              patternType: {
                type: Type.STRING,
                description: 'Must be AFFIRMATIVE, INQUIRY, DECLINE, or DELEGATE',
              },
              rationale: { type: Type.STRING },
              draftText: { type: Type.STRING },
              keyPointsCovered: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'id',
              'intentLabel',
              'patternType',
              'rationale',
              'draftText',
              'keyPointsCovered',
            ],
          },
        },
      },
    });

    const suggestions = JSON.parse(response.text || '[]').map((item: any, idx: number) => ({
      ...item,
      id: item.id || `sugg-${Date.now()}-${idx}`,
      status: 'pending',
    }));

    return res.json({ suggestions });
  } catch (error: any) {
    console.error('Error generating smart replies:', error);
    return res.status(500).json({
      error: 'Failed to generate smart replies: ' + (error?.message || 'Unknown error'),
    });
  }
});

// Endpoint 5: Analyze User's Historical Communication Style
app.post('/api/analyze-user-style', async (req, res) => {
  try {
    const { sentSamples } = req.body;

    const samplesText = Array.isArray(sentSamples) && sentSamples.length > 0
      ? sentSamples.slice(0, 10).map((s: any, idx: number) => `Sample ${idx + 1}:\n${s}`).join('\n\n---\n\n')
      : 'Sample sent message: "Hi David, thanks for checking in. The deployment was verified on staging and we are good to proceed tomorrow morning. Best regards, Saurav"';

    const prompt = `You are an expert computational linguist.
Analyze these historical sent email samples written by the user and extract their authentic communication style profile:

${samplesText}

Extract:
1. tone: 2-4 keywords describing their authentic voice (e.g. "Direct, collaborative, professional").
2. brevity: Exactly "concise", "balanced", or "thorough".
3. greeting: Typical opening phrase (e.g. "Hi {name}," or "Hello,").
4. signoff: Typical closing sign-off (e.g. "Best regards,", "Thanks,", "Cheers,").
5. signatureName: The user's name used in sign-offs if detected, or leave empty.
6. useBulletPoints: Boolean indicating whether they often use lists or bullet points.
7. customRules: 3-4 specific observations about how they write (e.g. "Prefers to answer questions in the very first sentence", "States explicit deadlines", "Uses warm but direct phrasing").`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tone: { type: Type.STRING },
            brevity: { type: Type.STRING },
            greeting: { type: Type.STRING },
            signoff: { type: Type.STRING },
            signatureName: { type: Type.STRING },
            useBulletPoints: { type: Type.BOOLEAN },
            customRules: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'tone',
            'brevity',
            'greeting',
            'signoff',
            'signatureName',
            'useBulletPoints',
            'customRules',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ profile: parsed });
  } catch (error: any) {
    console.error('Error analyzing user style:', error);
    return res.status(500).json({
      error: 'Failed to analyze user style: ' + (error?.message || 'Unknown error'),
    });
  }
});

// Mount Vite or static server
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
