# WEI THE DOG — landing page

Next.js (App Router) + Tailwind v4. Deploys to Vercel as-is.

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
npm run build && npm start   # production check
```

## Content (no code changes needed)

- **Episodes**: `content/episodes.json`. Fields: `number`, `title`, `description`, `thumbnail`, `video_url`, `locked`, `unlock_at_holders`, plus the optional `duration` (e.g. `"0:45"`) and `new` (shows the NEW tag).
  - A `locked` episode shows **Signal incoming**. It unlocks automatically once the live holder count reaches `unlock_at_holders`. To unlock it by hand, set `locked: false`.
  - The hero badge ("Episode 0X incoming") points at the first locked episode.
  - `video_url` accepts YouTube, Vimeo, a direct `.mp4`/`.webm` link, or a file in `public/episodes/` (e.g. `/episodes/ep01.mp4`). Remux new uploads with `ffmpeg -i in.mp4 -c copy -movflags +faststart public/episodes/epNN.mp4` so they start streaming immediately.
  - The **full film** plays `film.video_url` from `content/site.json` (now `/episodes/film.mp4`); if that is empty it plays every released episode back to back.
- **Contract, film, links, tweet**: `content/site.json`. A link left empty hides its button.
- **Images**: `public/wei-assets/`: `hero.mp4` + `hero-poster.jpg` (hero background loop; `hero.jpg` is the social-share image), `wei-logo.png` (logo, vitality avatar, favicon; source: `content/wei_image.png`), `tweet-fallback.jpg`, `ep01.jpg`…, `film-poster.jpg`, `hero-wide.jpg` (Join the Family background). To change an image, overwrite the file with the same name.

## Live dashboard

`/api/stats` runs on the server and caches every source for 60 seconds. The browser polls it every 60 seconds. Anything unknown or failing renders as `—`.

| Card | Source |
|---|---|
| Market cap, 24h volume, price, vitality | DexScreener, for the named Aerodrome pool `0xf9eb…38f2` (`content/site.json` → `pool`) |
| Fees collected, ETH sent home, rounds | The [Stockify index panel](https://www.stockify.finance/indices/0xa0cb7a7a4beb0b4bb819637a961c1dfe9bee3507), read live. Falls back to the committed `data/panel.json` |
| Holders, last transfer | The chain indexer's `data/rewards.json`, which folds every WEI `Transfer` since launch |

### Data pipeline (GitHub Actions)

The sandboxed dev environment can't reach Base, so every lookup runs on Actions and **commits** its result. Runners are ephemeral.

| Workflow | Script | What it does |
|---|---|---|
| `discover.yml` | `scripts/discover-token.mjs` | Pools, token and quote metadata read on chain, candidate distributor flows → `data/discovery.json` |
| `probe.yml` | `scripts/find-launch.mjs`, `scripts/panel-probe.mjs` | Deploy blocks via `eth_getCode` binary search → `data/launch.txt`; panel figures → `data/panel.json` |
| `index.yml` (every 15 min) | `scripts/panel-probe.mjs`, `scripts/index-rewards.mjs` | Resumes from `data/rewards-state.json`; writes `data/rewards.json`; prints a panel-vs-chain reconcile |

Every address and block in `scripts/config.mjs` was read from the network. Its `MISSING` list must be empty, or the indexer refuses to run. Scheduled crons can be delayed or dropped. To force a run, change `data/.index-trigger` and push.

### Payout announcer (`scripts/announce.mjs`)

Runs in `index.yml` right after the activity-feed probe:
- **Telegram:** each batch of new payouts is posted with `bot/media/payout.mp4`, giving the ETH sent, the number of holders and today's running total.
- **X:** once a day, a recap of yesterday's totals.

Each channel stays off until its repository secrets exist (Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|---|---|
| `TELEGRAM_BOT_TOKEN` | @BotFather → /newbot. Add the bot to the channel or group as an admin that can post |
| `TELEGRAM_CHAT_ID` | `@weithedog_portal` for a public channel, or the numeric `-100…` id for a private group |
| `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` | developer.x.com → your app, with **Read and write** user-auth permissions, then generate the access token and secret |

The first run only records the existing payouts, so the bot never posts history. `data/announce-state.json` remembers what was already posted.

Optional: add a private Base RPC as the repository secret `RPC_URL`. Otherwise the jobs use `https://mainnet.base.org`.

`vercel.json` skips Vercel builds for commits that only touch `data/`.

## Deploy on Vercel

1. Import `juanantin/wei` in Vercel (framework preset: Next.js, no root directory needed).
2. No environment variables are required (see `.env.example` for optional overrides).
3. Deploy, then add your domain under Settings → Domains.
