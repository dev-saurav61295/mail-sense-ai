import { EmailItem, RecipientRole } from '../types';

// Names the user is addressed by in email bodies, e.g. "Saurav Kaushik" -> ["Saurav Kaushik", "Saurav"]
export function getMyNames(displayName?: string | null): string[] {
  const full = (displayName || '').trim();
  if (!full) return [];
  const first = full.split(/\s+/)[0];
  return [...new Set([full, first])].filter((n) => n.length >= 3);
}

// Drop quoted reply history so earlier messages signed with the user's own name don't count as a mention
const QUOTE_MARKERS = [
  /\bOn\s.{5,200}?\swrote:/s, // Gmail
  /-{2,}\s*Original Message\s*-{2,}/i, // Outlook
  /\bFrom:\s.{0,300}?\b(?:Sent|Date):\s/s, // Outlook / forwarded header block
];

function stripQuotedText(text: string): string {
  const cuts = QUOTE_MARKERS.map((re) => text.search(re)).filter((i) => i >= 0);
  const own = cuts.length > 0 ? text.slice(0, Math.min(...cuts)) : text;
  return own
    .split('\n')
    .filter((line) => !line.trim().startsWith('>'))
    .join('\n');
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// TO: user's address is in To. MENTIONED: not in To but named in subject/body. CC: only in Cc. OTHER: none
// of those (BCC, group alias, list). Without a signed-in address (demo mode) every email counts as TO.
export function getRecipientRole(email: EmailItem, myEmail: string, myNames: string[]): RecipientRole {
  const me = myEmail.trim().toLowerCase();
  if (!me) return 'TO';

  const inField = (field?: string) => (field || '').toLowerCase().includes(me);
  if (inField(email.to)) return 'TO';

  const text = stripQuotedText(`${email.subject}\n${email.body || email.snippet}`);
  const mentioned = myNames.some((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(text));
  if (mentioned) return 'MENTIONED';

  return inField(email.cc) ? 'CC' : 'OTHER';
}

export const needsReply = (role: RecipientRole) => role === 'TO' || role === 'MENTIONED';
