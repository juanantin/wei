// Reads the index's own Stockify panel (server-rendered HTML) and writes the
// figures it shows to data/panel.json. Nothing is computed: anything the page
// does not show is null. Never overwrites a good file with an empty parse.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { INDEX_URL } from "./config.mjs";

export function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Accepts "1,234.5" and abbreviated "1.02K" / "3.4M" / "1.1B".
const num = (s) => {
  if (s == null) return null;
  const m = String(s).replace(/,/g, "").match(/^([\d.]+)([KMB])?$/i);
  if (!m) return null;
  return Number(m[1]) * ({ K: 1e3, M: 1e6, B: 1e9 }[(m[2] || "").toUpperCase()] ?? 1);
};

export function parsePanel(text) {
  const m = (re) => text.match(re);
  const paid = m(/Paid to holders \$([\d,.]+[KMB]?) ([\d.]+) ([A-Za-z]+)/);
  const fees = m(/Fees collected \$([\d,.]+[KMB]?) ([\d.]+) ([A-Za-z]+)/);
  const rounds = m(/Rounds paid ([\d,]+)/);
  const payments = m(/([\d,]+) wallet payments/);
  const waiting = m(/Waiting to be invested ([\d.]+) ([A-Za-z]+)/);
  const share = m(/To holders (\d+(?:\.\d+)?) ?%/);
  const minHold = m(/Holders under ([\d,]+) coins are skipped/);
  const activity = m(/EVERYTHING IT HAS DONE ([\d,]+) entries/);
  // Newest payout in the activity feed, e.g. "Paid out 0.0076 WETH to 99 holder s 9h ago"
  const last = m(/Paid out ([\d.]+) ([A-Za-z]+) to ([\d,]+) holder ?s? (\d+)([smhdw]) ago/);
  return {
    paidToHoldersUsd: num(paid?.[1]),
    paidToHolders: num(paid?.[2]),
    feesCollectedUsd: num(fees?.[1]),
    feesCollected: num(fees?.[2]),
    rewardSymbol: paid?.[3] ?? fees?.[3] ?? null,
    roundsPaid: num(rounds?.[1]),
    walletPayments: num(payments?.[1]),
    waitingToInvest: num(waiting?.[1]),
    toHoldersPct: num(share?.[1]),
    minHolding: num(minHold?.[1]),
    activityEntries: num(activity?.[1]),
    lastPayout: last
      ? { amount: num(last[1]), holders: num(last[3]), agoValue: num(last[4]), agoUnit: last[5] }
      : null,
  };
}

export async function probePanel() {
  const res = await fetch(INDEX_URL, { headers: { "user-agent": "Mozilla/5.0 wei-dashboard" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`panel HTTP ${res.status}`);
  const text = visibleText(await res.text());
  return { text, figures: parsePanel(text) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { text, figures } = await probePanel();
  mkdirSync("data", { recursive: true });
  writeFileSync("data/panel.txt", text + "\n");
  const ok = figures.paidToHolders != null && figures.feesCollected != null;
  const prev = existsSync("data/panel.json") ? JSON.parse(readFileSync("data/panel.json", "utf8")) : null;
  if (ok) writeFileSync("data/panel.json", JSON.stringify({ source: INDEX_URL, at: new Date().toISOString(), ...figures }, null, 2) + "\n");
  console.log("\n===== PANEL =====");
  console.log(ok ? "parsed OK" : `PARSE FAILED — kept previous file (${prev?.at ?? "none"})`);
  console.log(JSON.stringify(figures));
  console.log(text.slice(0, 1500));
}
