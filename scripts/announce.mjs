// Announces ETH sent to holders.
//   Telegram: one post (with bot/media/payout.mp4) per batch of new payouts.
//   X:        one recap of yesterday's totals, once a day.
// Source: data/feed.json (the Stockify index's own activity feed).
// State:  data/announce-state.json (committed) so nothing is posted twice.
// Each channel is skipped unless its secrets are set. First run only seeds state.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const FEED = "data/feed.json";
const STATE = "data/announce-state.json";
const VIDEO = "bot/media/payout.mp4";
const TG = { token: process.env.TELEGRAM_BOT_TOKEN, chat: process.env.TELEGRAM_CHAT_ID };
const X = {
  appKey: process.env.X_API_KEY, appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN, accessSecret: process.env.X_ACCESS_SECRET,
};
const LINKS = { tg: "t.me/weithedog_portal", site: process.env.SITE_URL || "" };
const DRY = process.env.DRY_RUN === "1";

if (!existsSync(FEED)) { console.log("no feed.json yet"); process.exit(0); }
const fmt = (n) => (n >= 0.01 ? n.toFixed(4) : n.toFixed(5)).replace(/0+$/, "").replace(/\.$/, "");
const feed = JSON.parse(readFileSync(FEED, "utf8"));
// All-time ETH paid to holders: the panel's own figure, else the sum of the feed's days.
const panel = existsSync("data/panel.json") ? JSON.parse(readFileSync("data/panel.json", "utf8")) : null;
const allTime = {
  eth: panel?.paidToHolders ?? Object.values(feed.days || {}).reduce((a, d) => a + d.paidToHolders, 0),
  usd: panel?.paidToHoldersUsd ?? null,
};
const usdFmt = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(2).replace(/\.?0+$/, "")}K` : `$${Math.round(n)}`);
const allTimeLine = allTime.eth ? `All-time sent home: ${fmt(allTime.eth)} ETH${allTime.usd ? ` (${usdFmt(allTime.usd)})` : ""}` : null;
const firstRun = !existsSync(STATE);
const state = firstRun ? { announced: [], lastRecap: null } : JSON.parse(readFileSync(STATE, "utf8"));
const done = new Set(state.announced);
const int = (n) => n.toLocaleString("en-US");
const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const log = (...a) => console.log(...a);

// ---------- Telegram ----------
async function tgPost(caption) {
  if (!TG.token || !TG.chat) return log("telegram: no secrets, skipped");
  if (DRY) return log("telegram (dry run):\n" + caption);
  const form = new FormData();
  form.append("chat_id", TG.chat);
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  form.append("animation", new Blob([readFileSync(VIDEO)], { type: "video/mp4" }), "payout.mp4");
  let res = await fetch(`https://api.telegram.org/bot${TG.token}/sendAnimation`, { method: "POST", body: form });
  let j = await res.json();
  if (!j.ok) {
    log("telegram: video failed, sending text only:", j.description);
    res = await fetch(`https://api.telegram.org/bot${TG.token}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: TG.chat, text: caption, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    j = await res.json();
  }
  if (!j.ok) throw new Error(`telegram: ${j.description}`);
  log("telegram: posted");
}

// ---------- X ----------
async function xPost(text) {
  if (!X.appKey || !X.appSecret || !X.accessToken || !X.accessSecret) return log("x: no secrets, skipped");
  if (DRY) return log("x (dry run):\n" + text);
  const require = createRequire(new URL("../.bot/", import.meta.url));
  const { TwitterApi } = require("twitter-api-v2");
  const client = new TwitterApi(X);
  let mediaId = null;
  try {
    mediaId = await client.v2.uploadMedia(readFileSync(VIDEO), { media_type: "video/mp4", media_category: "tweet_video" });
  } catch (e) {
    log("x: v2 media upload failed, trying v1.1:", e.message);
    try { mediaId = await client.v1.uploadMedia(VIDEO, { mimeType: "video/mp4", longVideo: false }); }
    catch (e2) { log("x: media upload failed, posting text only:", e2.message); }
  }
  const r = await client.v2.tweet(mediaId ? { text, media: { media_ids: [mediaId] } } : { text });
  log("x: posted", r.data?.id);
}

// ---------- New payouts → Telegram ----------
const payouts = (feed.recent || []).filter((e) => /^Paid out/i.test(e.kind) && e.tx);
const fresh = payouts.filter((e) => !done.has(e.tx));

if (firstRun) {
  log(`first run: seeding ${payouts.length} existing payouts, nothing posted`);
} else if (fresh.length) {
  const eth = fresh.reduce((a, e) => a + e.amount, 0);
  const wallets = fresh.reduce((a, e) => a + (e.holders || 0), 0);
  const d = feed.days?.[today];
  const caption = [
    "🐕📡 <b>ETH SENT HOME</b>",
    "",
    `<b>${fmt(eth)} ETH</b> just sent to <b>${int(wallets)}</b> $WEI holders.`,
    d ? `Today so far: ${fmt(d.paidToHolders)} ETH · ${int(d.holderPayments)} wallet payments` : null,
    allTimeLine ? `<b>${allTimeLine}</b>` : null,
    "",
    "No claiming. No staking. Just hold 10,000+ $WEI.",
    `<a href="https://basescan.org/tx/${fresh[0].tx}">View on Basescan</a>`,
  ].filter((l) => l !== null).join("\n");
  // Skip stale batches (e.g. after downtime) but still mark them as seen.
  if (fresh.every((e) => e.day < today) && fresh.length > 6) log(`skipping ${fresh.length} stale payouts`);
  else await tgPost(caption);
} else {
  log("no new payouts");
}
for (const e of payouts) done.add(e.tx);

// ---------- Daily recap of yesterday → X (and Telegram) ----------
const y = feed.days?.[yesterday];
if (!firstRun && state.lastRecap !== yesterday && y && new Date().getUTCHours() >= 0) {
  const text = [
    "🐕📡 Transfer home complete.",
    "",
    `Yesterday Wei sent ${fmt(y.paidToHolders)} ETH to $WEI holders: ${int(y.payouts)} payouts, ${int(y.holderPayments)} wallet payments.`,
    allTimeLine ? `${allTimeLine}.` : null,
    "",
    "No claiming. No staking. Just hold.",
    LINKS.tg,
  ].filter((l) => l !== null).join("\n");
  await xPost(text);
  state.lastRecap = yesterday;
}
if (firstRun) state.lastRecap = yesterday;

state.announced = [...done].slice(-500);
writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
