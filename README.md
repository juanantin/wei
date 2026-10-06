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
  - `video_url` accepts YouTube, Vimeo or a direct `.mp4`/`.webm` link.
- **Contract, film, links, tweet**: `content/site.json`. A link left empty hides its button.
- **Images**: `public/wei-assets/`: `hero.jpg` (hero), `wei-medallion.jpg` (nav + vitality avatar), `tweet-fallback.jpg`, `ep01.jpg`…, `film-poster.jpg`, `hero-wide.jpg` (Keep Wei Alive background). To change an image, overwrite the file with the same name.

## Live dashboard

`/api/stats` runs on the server only. It caches upstream calls for 60 seconds, and the browser polls it every 60 seconds. API keys come from env vars with no `NEXT_PUBLIC_` prefix, so they never reach the client. Any call that fails shows `—`.

| Card | Source |
|---|---|
| Market cap, 24h volume, price | DexScreener `latest/dex/tokens/{address}` (all chains, or limited by `DEXSCREENER_CHAIN`). Price and market cap come from the deepest pool; volume is summed across all pools |
| Holders | Blockscout (free) or Etherscan V2 `tokenholdercount` (Pro plan). Chosen with `HOLDERS_PROVIDER` |
| Fees collected / ETH sent home / Last transfer | Etherscan V2 normal and internal txs of `FEE_WALLET`: ETH in = fees, ETH out = distributed. You can override them with `*_OVERRIDE` |
| Wei vitality | 24h txns (buys + sells) ÷ `VITALITY_MAX_TXNS`, capped at 100% |

See `.env.example` for every variable.

## Deploy on Vercel

1. Import `juanantin/wei` in Vercel (framework preset: Next.js, no root directory needed).
2. Add the variables from `.env.example` under Project → Settings → Environment Variables.
3. Deploy, then add your domain under Settings → Domains.
