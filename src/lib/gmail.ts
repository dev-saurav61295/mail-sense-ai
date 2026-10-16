import { EmailItem } from '../types';

// Helper to decode Base64URL string into standard UTF-8 text
export function decodeBase64Url(base64UrlStr: string): string {
  try {
    const base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (err) {
    try {
      return atob(base64UrlStr.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

// Helper to encode UTF-8 text into Base64URL string for Gmail API
export function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Extract message text body from Gmail message payload parts recursively
function extractBodyFromPayload(payload: any): string {
  if (!payload) return '';

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (decoded) return decoded;
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    // Prefer plain text first
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    // Fall back to html or nested parts
    for (const part of payload.parts) {
      const body = extractBodyFromPayload(part);
      if (body) {
        // Strip basic HTML tags if html
        return body.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }

  return '';
}

// Parse sender name and email from "Name <email@example.com>" or "email@example.com"
function parseSender(fromHeader: string): { name: string; email: string } {
  if (!fromHeader) return { name: 'Unknown', email: '' };
  const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    const cleanName = match[1].replace(/^["']|["']$/g, '').trim();
    return {
      name: cleanName || match[2],
      email: match[2].trim(),
    };
  }
  return { name: fromHeader.split('@')[0], email: fromHeader.trim() };
}

// Fetch list of recent messages from user's Primary inbox (category:primary)
export async function fetchInboxMessages(
  accessToken: string,
  maxResults = 25,
  query = 'category:primary label:INBOX'
): Promise<EmailItem[]> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(
    query
  )}`;

  const listRes = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const errText = await listRes.text();
    throw new Error(`Gmail API request failed (${listRes.status}): ${errText}`);
  }

  const listData = await listRes.json();
  const messagesSummary = listData.messages || [];

  if (messagesSummary.length === 0) {
    return [];
  }

  // Fetch full details in parallel (chunks of 5 to avoid browser connection saturation)
  const results: EmailItem[] = [];
  const chunkSize = 5;

  for (let i = 0; i < messagesSummary.length; i += chunkSize) {
    const chunk = messagesSummary.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (msg: { id: string; threadId: string }) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!detailRes.ok) return null;
        const data = await detailRes.json();

        const headers = data.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const from = getHeader('From');
        const to = getHeader('To');
        const subject = getHeader('Subject') || '(No Subject)';
        const dateStr = getHeader('Date');
        const sender = parseSender(from);

        const body = extractBodyFromPayload(data.payload) || data.snippet || '';
        const timestamp = data.internalDate ? parseInt(data.internalDate, 10) : Date.now();
        const labelIds: string[] = data.labelIds || [];

        // Strictly enforce focus on Primary email: skip Promotions, Social, or Forums
        const isNonPrimary = labelIds.some((lbl: string) =>
          ['CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL', 'CATEGORY_FORUMS'].includes(lbl)
        );
        if (isNonPrimary) return null;

        return {
          id: data.id,
          threadId: data.threadId,
          from,
          fromName: sender.name,
          fromEmail: sender.email,
          to,
          subject,
          snippet: data.snippet || '',
          body,
          date: dateStr || new Date(timestamp).toLocaleString(),
          timestamp,
          isUnread: labelIds.includes('UNREAD'),
          isStarred: labelIds.includes('STARRED'),
          labelIds,
        } as EmailItem;
      } catch (e) {
        console.error(`Failed to fetch email detail ${msg.id}:`, e);
        return null;
      }
    });

    const resolved = await Promise.all(chunkPromises);
    for (const item of resolved) {
      if (item) results.push(item);
    }
  }

  return results;
}

// Fetch sample sent messages to learn user's historical communication style
export async function fetchSentMessages(
  accessToken: string,
  maxResults = 8
): Promise<string[]> {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=label:SENT`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const list = data.messages || [];
    const samples: string[] = [];

    for (const item of list.slice(0, 5)) {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const body = extractBodyFromPayload(detail.payload) || detail.snippet || '';
          if (body && body.length > 20) {
            samples.push(body.slice(0, 800));
          }
        }
      } catch {
        // continue
      }
    }
    return samples;
  } catch (e) {
    console.error('Failed to fetch sent messages:', e);
    return [];
  }
}

// Build standard RFC 2822 email format
function buildRfc822Message({
  to,
  subject,
  body,
  inReplyTo,
}: {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}): string {
  const formattedSubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
  const lines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(formattedSubject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
  ];

  if (inReplyTo) {
    lines.push(`In-Reply-To: ${inReplyTo}`);
    lines.push(`References: ${inReplyTo}`);
  }

  lines.push('');
  lines.push(body);

  return lines.join('\r\n');
}

// Create a draft in Gmail
export async function createGmailDraft(
  accessToken: string,
  params: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
  }
): Promise<{ id: string; message: any }> {
  const rfc822 = buildRfc822Message(params);
  const raw = encodeBase64Url(rfc822);

  const payload: any = {
    message: {
      raw,
    },
  };
  if (params.threadId) {
    payload.message.threadId = params.threadId;
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create Gmail draft (${res.status}): ${errorText}`);
  }

  return await res.json();
}

// Send an email directly via Gmail
export async function sendGmailMessage(
  accessToken: string,
  params: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
  }
): Promise<{ id: string; threadId: string }> {
  const rfc822 = buildRfc822Message(params);
  const raw = encodeBase64Url(rfc822);

  const payload: any = { raw };
  if (params.threadId) {
    payload.threadId = params.threadId;
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to send email (${res.status}): ${errorText}`);
  }

  return await res.json();
}

// Modify message labels (e.g. mark read, unread, or remove from inbox)
export async function modifyGmailLabels(
  accessToken: string,
  messageId: string,
  removeLabelIds: string[] = [],
  addLabelIds: string[] = []
): Promise<void> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addLabelIds, removeLabelIds }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update labels for message ${messageId}: ${err}`);
  }
}
