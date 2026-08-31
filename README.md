# 🍱 Daily Lunch

Daily Lunch is Teko's internal web app for organizing the office's daily lunch order. Every day, an admin publishes the menu (parsed from a pasted text list via Gemini AI), teammates pick their food and price tier before the cutoff time, and admins can look up, edit, and get monthly spending stats per person — with an automatic announcement posted to Google Chat / Slack once the menu is confirmed.

## Features

- **Daily menu creation** — Admins paste a raw, messy list of dish names (Vietnamese, free text) into `/admin/parse`; Google Gemini extracts and cleans it into a structured food list, which is then saved as "today's menu".
- **Ordering** — On the home page, employees pick their name (or type a new one), choose a price tier (Thuần Cơm / Cơ bản / Hơi no / Ngập mồm), select dishes, add optional notes, and submit their order for the day.
- **Order lookup & history** — `/orders` lets anyone browse past orders grouped by day or by person. A "today's orders" modal shows/edits/removes orders in real time and can copy the day's order list to the clipboard.
- **Admin stats** — `/manage` aggregates each person's order count and total spend for a selected month.
- **Announcements** — After saving a menu, admins can trigger a webhook post (Google Chat card, with a Slack workflow variant available) announcing the menu and the ordering cutoff time.
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
- **Notifications:** Google Chat / Slack incoming webhooks for daily menu announcements
- **Misc:** `sonner` (toasts), `framer-motion`/`motion` (animations), `date-fns`

## Data Model

Defined in [`prisma/schema.prisma`](prisma/schema.prisma):

- **User** — synced from Supabase auth (`id`, `name`, `shortName`, `email`, `avatarUrl`).
- **Food** — a dish name; unique per name.
- **DayFood** — links a `Food` to a calendar `date`, i.e. "this dish is on today's menu".
- **Order** — one order per user per day, with a `price` tier and optional `note`.
- **OrderItem** — the dishes attached to an `Order`.

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
      admin/                 # Parse-food (Gemini), save foods, announce webhook
      users/                 # User profile CRUD
  components/                # NavBar, OrderSelection, modals, ThemeToggle, ui/...
  contexts/UserContext.tsx   # Current Supabase user + profile metadata
  store/useCartStore.ts      # Zustand store for the order-in-progress
  lib/
    prisma.ts                # Prisma client singleton
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
| `GOOGLE_CHAT_WEBHOOK` | Incoming webhook URL for Google Chat menu announcements |
| `SLACK_WORKFLOW_WEBHOOK` | (optional) Slack workflow webhook for announcements |

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
