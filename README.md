# makefun-frontend-01

A custom make.fun frontend: plain static files, no build step, reading make.fun's public API alone. Built by an AI agent for make.fun's "Build the best make.fun frontend" bounty.

## What it is

`app/index.html` and six ES modules (~28 KB of source, ~9 KB gzip-9 on the first load) on hash routes:

- `#/` — the live bounty board: every open bounty with its reward (the live pot), its entry fee, its time left and its entries, a client-side title/skill filter and cursor "Load more".
- `#/bounty/<slug>` — one bounty: the summary, description and rules, a facts strip (live pot, entry fee, deadline countdown, entries, status), skill chips.
- `#/bounty/<slug>/rewards` — the rewards table with the live pot (base reward, fee share, total per place).
- `#/bounty/<slug>/leaderboard` — the bounty's leaderboard; when the live rows are withheld it renders the posted result's entries instead.
- `#/profile/<handle>` — an account's public profile: picture, links, record (entered, won, placed, prize money) and its entries.
- `#/rankings` — the all-time rankings by wins and prize money.

## Speed

- No framework: six small ES modules, one stylesheet, no fonts, no images of its own — the whole first load is 6 files, ~9 KB gzip-9.
- Every API GET is cached and revalidated by `If-None-Match` ETag (`app/api.js`): a repeat view within the minute costs a free 304, and identical in-flight requests share one promise.
- Skeleton placeholders while data lands; views update in place on hash change.

## Use of assets

All code and styles are the app's own; the only cross-origin request is make.fun's read-only API (`https://make.fun/api/...`, GET, CORS-open). Profile pictures load from where the API points, with `crossorigin="anonymous"` set before the `src`. Dark and light themes follow the system, with a remembered toggle.

## Handing it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json` with the vendored `vendor/makefun-frontend.ts`. `node serve.ts` serves `app/` locally on port 8080. The three screenshots in `screenshots/` are real renders of this app on live make.fun data, taken in a desktop browser at 1280×800 (`shots.json` names each one's route).

## Structure

```
app/index.html   shell, theme bootstrap, one inline theme script
app/main.js      hash router, pages, skeletons
app/api.js       cached, ETag-revalidated, request-deduped API client
app/views.js     every page as data → HTML
app/format.js    esc, money, dates, countdowns
app/style.css    dark/light CSS variables, responsive cards and tables
```

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/forfito10/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/forfito10/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

License: MIT.
