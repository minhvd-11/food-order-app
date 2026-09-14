# 🍱 Daily Lunch

Daily Lunch is Teko's internal web app for organizing the office's daily lunch order. Every day, an admin publishes the menu (parsed from a pasted text list via Gemini AI), teammates pick their food and price tier before the cutoff time, and admins can look up, edit, and get monthly spending stats per person — with an automatic announcement posted to Google Chat / Slack once the menu is confirmed.

## Features

- **Daily menu creation** — Admins paste a raw, messy list of dish names (Vietnamese, free text) into `/admin/parse`; Google Gemini extracts and cleans it into a structured food list, which is then saved as "today's menu".
- **Ordering** — On the home page, employees pick their name (or type a new one), choose a price tier (Thuần Cơm / Cơ bản / Hơi no / Ngập mồm), select dishes, add optional notes, and submit their order for the day.
- **Order lookup & history** — `/orders` lets anyone browse past orders grouped by day or by person. A "today's orders" modal shows/edits/removes orders in real time and can copy the day's order list to the clipboard.
- **Admin stats** — `/manage` aggregates each person's order count and total spend for a selected month.
- **Announcements** — After saving a menu, admins trigger an announcement of the menu and ordering cutoff. It goes to the Google Chat space via an incoming webhook **and**, separately, as a 1:1 DM to everyone subscribed to the lunch Chat bot (see [Google Chat lunch bot](#google-chat-lunch-bot-per-user-dms)). A Slack workflow variant is available too.
- **Order confirmation DM** — When someone submits an order, the Chat bot DMs them a confirmation card led by the order's number for the day (which people read out to collect their food, so it appears in the card header, as a highlighted row, and in the plain-text fallback), followed by the dishes they picked, their note, and the price tier. Only for people subscribed to the bot; the order is saved regardless of whether the DM succeeds.
- **Auth & profile** — Email/password and Google OAuth login via Supabase, with a profile page to view your personal order history and edit your display name/avatar.
- **Light/Dark theme** — Full light/dark mode support (via `next-themes`) with a toggle switch in the navbar, respecting the system preference by default.
- **Lunar New Year mode** — When no menu is configured for the day, the home page shows an animated Tết-themed landing hero instead of the ordering form.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org) (App Router, Turbopack, Server Actions)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com)-style components (Radix UI primitives + `class-variance-authority`), `next-themes` for dark mode
- **State:** Zustand (cart/order form state), React Context (current user)
- **Database:** PostgreSQL via [Prisma ORM](https://www.prisma.io)
- **Auth:** [Supabase](https://supabase.com) (email/password + Google OAuth, SSR-aware middleware session refresh)
- **AI:** Google Gemini (`@google/generative-ai`) for parsing free-text menus into structured food lists
- **Notifications:** Google Chat incoming webhook (space) + a Google Chat app/bot sending per-user DMs via the Chat API; optional Slack workflow webhook
- **Misc:** `sonner` (toasts), `framer-motion`/`motion` (animations), `date-fns`

## Data Model

Defined in [`prisma/schema.prisma`](prisma/schema.prisma):

- **User** — synced from Supabase auth (`id`, `name`, `shortName`, `email`, `avatarUrl`).
- **Food** — a dish name; unique per name.
- **DayFood** — links a `Food` to a calendar `date`, i.e. "this dish is on today's menu".
- **Order** — one order per user per day, with a `price` tier and optional `note`.
- **OrderItem** — the dishes attached to an `Order`.
- **ChatSubscriber** — a Google Chat user subscribed to the bot's daily DM, storing their Chat user id and the 1:1 DM space to post into. Linked to a `User` by email, falling back to the email's local part vs `shortName`, since `User.email` is null for people created from the order form.

## Project Structure

```
src/
  app/
    page.tsx                 # Home: ordering form or Tết landing hero
    orders/                  # Order lookup/history page
    manage/                  # Monthly stats for admins
    admin/parse/             # AI menu parsing + save + announce
    account/                 # User profile page
    login/                   # Email + Google login
    api/
      foods/today/           # Today's configured menu
      orders/                # Create/list/filter/manage orders
      admin/                 # Parse-food (Gemini), save foods, announce
      chat/bot/              # Google Chat app endpoint (subscribe/unsubscribe)
      users/                 # User profile CRUD
  components/                # NavBar, OrderSelection, modals, ThemeToggle, ui/...
  contexts/UserContext.tsx   # Current Supabase user + profile metadata
  store/useCartStore.ts      # Zustand store for the order-in-progress
  lib/
    prisma.ts                # Prisma client singleton
    googleChat.ts            # Chat API client (service account) + menu card
    googleChatEvents.ts      # Verifies + normalizes inbound Chat events
    chatNotifications.ts     # Per-user DMs for app events (order confirmation)
    supabase/                # Client/server/middleware Supabase helpers
prisma/                      # Prisma schema + migrations
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` (database) and `.env.local` (app secrets) with:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_SITE_URL` / `SITE_URL` | Public base URL, used for OAuth redirects and announcement links |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (configured in Supabase auth provider) |
| `GEMINI_API_URL` / `GEMINI_API_KEY` | Google Gemini endpoint + key for menu parsing |
| `GOOGLE_CHAT_WEBHOOK` | Incoming webhook URL for the Google Chat **space** announcement |
| `GOOGLE_CHAT_SERVICE_ACCOUNT` | Service account JSON for the Chat bot (raw JSON or base64), enables per-user DMs |
| `GOOGLE_CHAT_PROJECT_NUMBER` | Cloud project number. Required if the app is a Chat **add-on** (it identifies the add-ons service agent that signs requests), and also serves as the audience if Authentication Audience is **Project Number** |
| `GOOGLE_CHAT_SERVICE_AGENT_EMAIL` | (optional) Explicit sender address to trust, instead of deriving it from the project number |
| `GOOGLE_CHAT_ENDPOINT_URL` | Set if the Authentication Audience is **HTTP endpoint URL** (recommended); must match the configured URL exactly |
| `SLACK_WORKFLOW_WEBHOOK` | (optional) Slack workflow webhook for announcements |

Each announcement channel is independent: set only `GOOGLE_CHAT_WEBHOOK` and you get the space post, set only the two `GOOGLE_CHAT_*` bot vars and you get DMs, set all three and you get both.

### 2b. Google Chat lunch bot (per-user DMs)

Incoming webhooks can only post to a space — DMing a person requires a real Chat
app. One-time setup:

1. **Google Cloud project** → enable the **Google Chat API**.
2. **Service account** → create one, download its JSON key, and put the key in
   `GOOGLE_CHAT_SERVICE_ACCOUNT` (raw JSON, or base64 it to survive Vercel's
   env-var UI: `base64 -w0 key.json`). No domain-wide delegation is needed —
   the bot only ever posts as itself.
3. **Chat API → Configuration**:
   - *Application info*: App name (≤25 chars), Avatar URL (HTTPS, square
     PNG/JPEG, 256×256+), Description (≤40 chars). All three are required.
   - *Interactive features*: leave **Enable interactive features** on.
   - *Functionality*: 1:1 messaging is on by default; also tick **Join spaces
     and group conversations** if people should be able to `@mention` it.
   - *Connection settings*: **HTTP endpoint URL** →
     `https://<your-domain>/api/chat/bot`.
   - *Authentication Audience*: either option works —
     **HTTP endpoint URL** (Google's recommendation for self-hosted endpoints
     like Vercel) → set `GOOGLE_CHAT_ENDPOINT_URL` to that exact same URL, or
     **Project Number** → set `GOOGLE_CHAT_PROJECT_NUMBER` instead.
   - *Visibility*: add the people or a Google Group who should see the app. No
     Marketplace publishing or admin approval is needed for a team.
4. Set `GOOGLE_CHAT_PROJECT_NUMBER` to your Cloud project number. Google signs
   requests as one of two senders depending on how the app is built:
   `chat@system.gserviceaccount.com` for a classic Chat app, or
   `service-<PROJECT_NUMBER>@gcp-sa-gsuiteaddons.iam.gserviceaccount.com` when
   the app is a Chat add-on. The second is project-specific, so it has to be
   pinned to *your* project — trusting the whole `gcp-sa-gsuiteaddons` domain
   would let any Google Cloud project post to this endpoint. (If Google ever
   sends a different address, `GOOGLE_CHAT_SERVICE_AGENT_EMAIL` overrides the
   derived one; the rejection log names the address it saw.)
5. The endpoint verifies every request's bearer token and **rejects everything
   if no audience variable is set**, so a half-configured deploy can't be driven
   by strangers.

`GET /api/chat/bot` reports how the running deployment is configured — audience
mode, expected audience, and accepted senders — which is the fastest way to
check that Vercel actually picked up the variables (it does not apply new
environment variables to an existing deployment; you must redeploy).

Then anyone can find the bot in Google Chat, start a DM, and they're subscribed
automatically. In a DM the bot understands:

| Command | Effect |
| --- | --- |
| `subscribe` / `dk` / `đăng ký` | Start receiving the daily menu DM |
| `unsubscribe` / `huỷ` | Stop receiving it |
| `status` | Check whether you're subscribed |
| `help` | Show the command list |

Removing the app unsubscribes you. If a DM later fails because the app was
removed, that subscriber is deactivated automatically on the next announcement.

### 3. Set up the database

```bash
npm run prisma:generate   # generate the Prisma client
npm run prisma:push       # push the schema to your database
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the project |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:push` | Push the Prisma schema to the database |
| `npm run prisma:studio` | Open Prisma Studio |

## Deployment

Deployed on [Vercel](https://vercel.com). See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for details.
