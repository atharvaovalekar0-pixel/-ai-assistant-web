# AI Assistant (Next.js + Gemini, deploys on Vercel)

A general-purpose chat assistant — ask it anything, with live web search when
a question needs current information — built as a Next.js app so it deploys
on Vercel in a couple of clicks.

## How it's built

- **Frontend** (`app/page.tsx`): a chat UI. Chat sessions and their messages
  are stored in the browser's `localStorage`, so your chat history persists
  between visits without needing a database.
- **Backend** (`app/api/chat/route.ts`): a serverless API route. It receives
  the conversation so far plus your new message, calls Google's Gemini API
  with web search grounding enabled, and returns the reply. Your API key
  stays server-side and is never sent to the browser.

## Run it locally first (recommended)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and add your Gemini API key (get a
   free one at https://aistudio.google.com/apikey):
   ```bash
   cp .env.example .env.local
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to https://vercel.com/new and import that repository. Vercel
   auto-detects it as a Next.js app — no configuration needed.
3. Before deploying (or right after, then redeploy), add an environment
   variable in the Vercel project: **Settings → Environment Variables**
   - Name: `GEMINI_API_KEY`
   - Value: your key from https://aistudio.google.com/apikey
4. Click **Deploy**. You'll get a live `.vercel.app` URL in about a minute.

That's the whole flow — every future `git push` to your main branch
auto-deploys the update.

## Notes and next steps

- **Chat history is per-browser**, not per-account: it lives in `localStorage`
  on whichever device/browser you use. If you want history to follow a user
  across devices, that needs real user accounts plus a database (e.g. Vercel
  Postgres or Supabase) instead of `localStorage` — a good next step for your
  FYP if you want multi-user support.
- **Model**: set in `MODEL_NAME` in `app/api/chat/route.ts` — currently
  `gemini-2.5-flash`. Swap it for a newer Gemini model if your API key has
  access to one.
- **Rate limits / cost**: the free Gemini API tier has generous but limited
  request quotas — fine for a demo or FYP viva, not for production traffic.
