// Walks the Stockify index's activity feed (?page=1..N) and totals, per day as
// the panel groups them: ETH paid out to holders, fees in, payout rows and
// holder payments. Pure reading of the index's own page, no RPC needed.
// Writes data/feed.json. Never overwrites a good file with an empty parse.
import { writeFileSync, mkdirSync } from "node:fs";
import { INDEX_URL } from "./config.mjs";

const MONTHS = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
const toIso = (d) => {
  const m = d.trim().match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/);
  return m ? `${m[3]}-${MONTHS[m[2]]}-${m[1].padStart(2, "0")}` : null;
};
const strip = (s) => s.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function parsePage(html, carryDay = null) {
  const feed = html.slice(html.indexOf('class="idx-feed"'), html.indexOf("</ol>", html.indexOf('class="idx-feed"')));
  const out = [];
  let day = carryDay; // a page can continue the previous page's day without repeating its header
  for (const li of feed.split("<li").slice(1)) {
    if (li.includes("idx-feed-day")) { day = toIso(strip(li.slice(li.indexOf(">") + 1))); continue; }
    const kind = (li.match(/class="idx-kind">([^<]+)</) || [])[1];
    const amount = Number((li.match(/class="idx-feed-amount">([\d.,]+)</) || [])[1]?.replace(/,/g, ""));
    const holders = Number((strip(li).match(/to (\d[\d,]*) holder/) || [])[1]?.replace(/,/g, "") ?? NaN);
    const tx = (li.match(/basescan\.org\/tx\/(0x[0-9a-f]{64})/i) || [])[1];
    if (day && kind && Number.isFinite(amount)) out.push({ day, kind, amount, holders: Number.isFinite(holders) ? holders : null, tx });
  }
  const pages = Number((strip(html).match(/Page (\d+) of (\d+)/) || [])[2] || 1);
  return { entries: out, pages, lastDay: day };
}

async function get(page) {
  const res = await fetch(`${INDEX_URL}?page=${page}`, { headers: { "user-agent": "Mozilla/5.0 wei-dashboard" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`page ${page}: HTTP ${res.status}`);
  return res.text();
}

const first = parsePage(await get(1));
const all = [...first.entries];
let carry = first.lastDay;
for (let p = 2; p <= Math.min(first.pages, 60); p++) {
  const pg = parsePage(await get(p), carry);
  all.push(...pg.entries);
  carry = pg.lastDay;
  await new Promise((r) => setTimeout(r, 400));
}

// De-duplicate (an entry can shift onto the next page while we read).
const seen = new Set();
const entries = all.filter((e) => { const k = `${e.tx}|${e.kind}|${e.amount}|${e.holders}`; if (seen.has(k)) return false; seen.add(k); return true; });

const days = {};
for (const e of entries) {
  const d = (days[e.day] ??= { paidToHolders: 0, feesIn: 0, payouts: 0, holderPayments: 0, feeEvents: 0 });
  if (/^Paid out/i.test(e.kind)) { d.paidToHolders += e.amount; d.payouts++; d.holderPayments += e.holders ?? 0; }
  else if (/^Fees in/i.test(e.kind)) { d.feesIn += e.amount; d.feeEvents++; }
}
for (const d of Object.values(days)) { d.paidToHolders = +d.paidToHolders.toFixed(4); d.feesIn = +d.feesIn.toFixed(4); }

const result = {
  source: INDEX_URL, at: new Date().toISOString(), pages: first.pages, entries: entries.length,
  note: "Amounts as shown on the panel (rounded to 4 dp); days as the panel groups them.",
  days: Object.fromEntries(Object.entries(days).sort().reverse()),
  // Newest first; used by scripts/announce.mjs to spot new payouts.
  recent: entries.slice(0, 80),
};

console.log("\n===== FEED =====");
console.log(`pages ${first.pages}, entries ${entries.length}`);
for (const [day, d] of Object.entries(result.days).slice(0, 5)) console.log(day, JSON.stringify(d));
if (entries.length) {
  mkdirSync("data", { recursive: true });
  writeFileSync("data/feed.json", JSON.stringify(result, null, 2) + "\n");
} else {
  console.log("PARSE FAILED — kept previous feed.json");
}
