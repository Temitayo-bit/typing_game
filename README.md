# Typing Game

A typing practice web app with beginner touch-typing lessons, adaptive speed tests, themed text packs, and progress tracking.

## Features

- **Lessons:** 20 lessons in 5 levels (home row, top row, bottom row, capitals and punctuation, numbers and real text). Each lesson has 8 practices that move from letter groups to real words, with an on-screen keyboard showing which finger to use. A practice unlocks the next at 90% accuracy; speed is never a gate.
- **Practice:** 15/30/60 second tests and 10/25/50 word tests that only use the keys learned so far, opening up to every word once all letters are unlocked. Themed passages are also available.
- **Weak-key drills:** a short drill built from words that lean on the keys missed most.
- **Feedback:** live WPM and accuracy, raw WPM, a speed-over-time chart, and the keys that caused mistakes.
- **Progress:** personal bests, a WPM trend chart, an activity heatmap, daily streaks, and export/import of history as JSON.
- **Milestones:** small achievements (first test, speed and accuracy marks, finished lessons, streaks), each shown once.
- **Notes:** short personal texts to type that unlock over time.
- **Themes and sounds:** four colour themes, optional key sounds and soft background music (off by default), all synthesised in the browser.
- Installable as an app (PWA) and works offline.

Results are saved in the browser first (IndexedDB) and backed up to Supabase when signed in, so the app keeps working offline.

## Accounts (optional)

With Supabase configured, sign-in is by email magic link, limited to an allowlist. Each account has its own profile (name, photo, optional birthday and speed goal), settings and results, separated by row-level security in the database and by a separate local store per account in the browser.

1. Apply the SQL files in `supabase/migrations/` to your project.
2. Add allowed emails: `insert into private.signup_allowlist (email) values ('you@example.com');`
3. In Supabase Auth settings, set the Site URL (and redirect URLs) to where the app is hosted.
4. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.

Without these variables the app runs fully offline for a single person.

## Getting started

```sh
npm install
npm run dev
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run unit tests (Vitest) |
| `npm run lint` | Lint with oxlint |
| `npm run typecheck` | Type-check only |

## How scoring works

- **WPM** = correct characters ÷ 5 ÷ minutes. Correct characters are the letters of correctly typed words plus the space after each, plus the correct start of the word in progress.
- **Raw WPM** counts every character keystroke, right or wrong.
- **Accuracy** = correct keystrokes ÷ all character keystrokes. Fixing a mistake with backspace does not undo it.

## Tech

Vite, React, TypeScript (strict), Tailwind CSS, Dexie (IndexedDB), Supabase (auth, Postgres, storage), vite-plugin-pwa, Vitest.

A scheduled GitHub Action pings the database every few days so a free-tier project doesn't pause.
