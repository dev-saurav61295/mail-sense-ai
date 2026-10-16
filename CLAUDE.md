# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` (a `bun.lock` also exists, so `bun install` works too)
- `npm run dev` — runs `tsx server.ts`: Express API plus Vite in middleware mode on `http://localhost:3000` (override with `PORT`)
- `npm run lint` — `tsc --noEmit`; this is the only static check
- `npm run build` — `vite build` into `dist/`. Serving it needs `NODE_ENV=production npm start`, because `server.ts` serves `dist/` only in that mode
- `npm run clean` — removes `dist` and `server.js`

There is no test runner or test suite.

Set `GEMINI_API_KEY` in `.env` or `.env.local` (see `.env.example`). `.env*` is gitignored except `.env.example`.

## Architecture

The project is an AI Studio-generated app. A single Express process (`server.ts`) does two jobs: it hosts the Gemini-backed JSON API, and it serves the React 19 + Tailwind 4 SPA. In dev it mounts Vite middleware. In production it serves `dist/` with an SPA fallback.

### Server (`server.ts`)

The browser never calls Gemini directly. Five POST endpoints wrap `@google/genai`, each building a prompt inline and, where structured output is needed, passing `responseMimeType: 'application/json'` plus a `responseSchema`:

- `/api/analyze-batch` — triages up to 15 emails. Returns category (`REPLY_NOW`/`REPLY_LATER`/`IGNORE`), severity, urgency score, summary, action items, deadline, and four canned reply drafts.
- `/api/generate-reply` — free-text reply for a given tone and instruction.
- `/api/productivity-insights` — inbox health analysis built from the metrics.
- `/api/generate-smart-replies` — 3 style-aware reply options, driven by the `UserStyleProfile`.
- `/api/analyze-user-style` — infers a `UserStyleProfile` from sent-mail samples.

All endpoints go through `generateWithFallback()`, which tries a fixed list of model names in order and rethrows the last error. To change models, edit the `candidateModels` array there.

The response shapes defined in the schemas must stay in sync with `src/types.ts` (`EmailAnalysis`, `SmartReplySuggestion`, `UserStyleProfile`, `AiProductivityInsights`), because the client maps the JSON onto those types by hand.

### Client (`src/`)

- `App.tsx` holds nearly all state: emails, the selected email, the user style profile, the active view/tab, and the confirmation dialog. Components in `src/components/` are mostly presentational and receive callbacks.
- **Demo vs. live mode.** `isDemoMode` starts `true` and the app loads `DEMO_EMAILS` from `lib/demoData.ts`. AI calls still hit the server in demo mode. Only Gmail reads and writes are gated on `!isDemoMode && token`. Signing out resets to demo data.
- `lib/auth.ts` — Firebase Auth Google popup sign-in requesting the `gmail.modify` scope. The OAuth access token is cached **in memory only**, never in localStorage or sessionStorage. After a page reload, Firebase may still have a user but no token, which `initAuth` treats as a failure, so the user must sign in again.
- `lib/storage.ts` — localStorage persistence keyed by Firebase uid, for AI output only (per-email `EmailAnalysis` map capped at 500, plus the style profile). Email bodies and the token are never stored. `App.tsx` re-attaches saved analyses after each sync so only new emails go to Gemini, and persists only while `liveDataRef` is true, so demo data is never saved. Sign-out wipes the stored data. After the auth listener restores a session, `App.tsx` auto-syncs through `syncRef`.
- `lib/recipient.ts` — classifies each email as `TO` / `MENTIONED` / `CC` / `OTHER` for the signed-in user (address in To, else name in subject/body outside quoted history, else Cc). `runBatchAnalysis` in `App.tsx` forces `CC`/`OTHER` mail to `IGNORE` after the AI responds, in addition to the rule in the `/api/analyze-batch` prompt. Quoted history is cut at Gmail (`On … wrote:`) and Outlook (`Original Message`, `From:`/`Sent:` blocks) markers before matching names. `markRepliedThreads` in `lib/gmail.ts` flags emails whose thread's newest message has the `SENT` label (one extra Gmail request per thread per sync); those are forced to `IGNORE` too. Saved analyses record `recipientRole`/`alreadyReplied`, and ones without `recipientRole` are discarded on sync so they get re-analyzed. Replies are built with `To:` the sender only; Cc is not carried over.
- `lib/gmail.ts` — calls the Gmail REST API directly from the browser with the bearer token: list, fetch, and parse messages; create drafts; send; modify labels. It decodes base64url and recursively walks MIME parts to extract the body.
- Firebase config comes from `firebase-applet-config.json`, which is imported directly by `lib/auth.ts`.
- Every action that mutates Gmail (send, save draft, mark read, trash, batch actions) is expected to go through `ConfirmationModal` via the `confirmDialog` state in `App.tsx`. Keep new mutating actions behind it.

### Build config notes

- `vite.config.ts` defines the `@` alias as the repo root, not `src/`. HMR and file watching are controlled by `DISABLE_HMR`, which AI Studio sets. The comments in that file say not to modify that logic.
- `tsconfig.json` uses `noEmit` and `moduleResolution: bundler`. `server.ts` is run by `tsx`, not compiled.
