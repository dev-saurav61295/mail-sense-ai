import { EmailAnalysis, UserStyleProfile } from '../types';

// Browser persistence for AI output only (analysis + style profile), keyed by Firebase uid.
// Email bodies and the Gmail access token are never stored here.
const ANALYSES_KEY = (uid: string) => `mailsense:analyses:${uid}`;
const STYLE_KEY = (uid: string) => `mailsense:style:${uid}`;
const MAX_STORED_ANALYSES = 500;

export type AnalysisMap = Record<string, EmailAnalysis>;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Could not persist to localStorage:', err);
  }
}

export function loadAnalyses(uid: string): AnalysisMap {
  return read<AnalysisMap>(ANALYSES_KEY(uid)) || {};
}

// Merges into the stored map so analyses for emails outside the current sync window survive.
export function saveAnalyses(uid: string, current: AnalysisMap) {
  const merged = { ...loadAnalyses(uid), ...current };
  const ids = Object.keys(merged);
  const trimmed =
    ids.length > MAX_STORED_ANALYSES
      ? Object.fromEntries(ids.slice(ids.length - MAX_STORED_ANALYSES).map((id) => [id, merged[id]]))
      : merged;
  write(ANALYSES_KEY(uid), trimmed);
}

export function loadStyle(uid: string): UserStyleProfile | null {
  return read<UserStyleProfile>(STYLE_KEY(uid));
}

export function saveStyle(uid: string, style: UserStyleProfile) {
  write(STYLE_KEY(uid), style);
}

export function clearUserData(uid: string) {
  try {
    localStorage.removeItem(ANALYSES_KEY(uid));
    localStorage.removeItem(STYLE_KEY(uid));
  } catch {
    // ignore
  }
}
