// Discovery: from the token contract alone, ask the network for everything the
// dashboard needs. Writes data/discovery.json (committed by the workflow) and
// prints a summary LAST so it survives the log tail.
//
//   TOKEN=0x... node scripts/discover-token.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import {
  getJson, rpc, erc20Meta, blockForTimestamp, blockscoutAll, fmtUnits, addr, sleep, RPC_URL, BLOCKSCOUT,
} from "./lib.mjs";

const TOKEN = (process.env.TOKEN || "").toLowerCase();
if (!/^0x[0-9a-f]{40}$/.test(TOKEN)) throw new Error("TOKEN=0x… required");

// Candidate distributors to test. The index is a candidate, not a fact, until
// its reward-token flow is seen going both in AND out.
const CANDIDATES = ["0xa0cb7a7a4beb0b4bb819637a961c1dfe9bee3507"];

const out = { token: TOKEN, rpc: RPC_URL.replace(/\/\/.*@/, "//***@").replace(/(key|apikey)=[^&]+/i, "$1=***"), at: new Date().toISOString() };
const log = (...a) => console.log(...a);

// ---------- 1. DexScreener pools ----------
const dex = await getJson(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN}`);
const pairs = (dex.pairs ?? []).map((p) => ({
  chainId: p.chainId, dexId: p.dexId, labels: p.labels, pairAddress: p.pairAddress, url: p.url,
  base: p.baseToken, quote: p.quoteToken, priceUsd: p.priceUsd, priceNative: p.priceNative,
  marketCap: p.marketCap, fdv: p.fdv, liquidityUsd: p.liquidity?.usd, volume24h: p.volume?.h24,
  txns24h: p.txns?.h24, pairCreatedAt: p.pairCreatedAt,
}));
out.dexscreener = { error: dex.__error ?? null, pairs };
const basePairs = pairs.filter((p) => p.chainId === "base").sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0));
const deepest = basePairs[0] ?? null;
out.deepestPool = deepest;

// ---------- 2. On-chain metadata ----------
try {
  out.chainId = Number(BigInt(await rpc("eth_chainId", [])));
  out.latestBlock = Number(BigInt(await rpc("eth_blockNumber", [])));
} catch (e) { out.rpcError = e.message; }

out.tokenMeta = await erc20Meta(TOKEN);
if (deepest?.quote?.address) out.quoteMeta = await erc20Meta(deepest.quote.address.toLowerCase());

// ---------- 3. Launch block ----------
out.launch = {};
if (deepest?.pairCreatedAt) {
  try {
    out.launch.pairCreatedAt = deepest.pairCreatedAt;
    out.launch.blockFromPairCreatedAt = await blockForTimestamp(Math.floor(deepest.pairCreatedAt / 1000));
  } catch (e) { out.launch.timestampSearchError = e.message; }
}
const bsToken = await getJson(`${BLOCKSCOUT}/api/v2/tokens/${TOKEN}`);
out.blockscoutToken = bsToken.__error ? { error: bsToken.__error } : {
  name: bsToken.name, symbol: bsToken.symbol, decimals: bsToken.decimals, holders: bsToken.holders_count ?? bsToken.holders,
  total_supply: bsToken.total_supply, type: bsToken.type,
};
const bsTokenAddr = await getJson(`${BLOCKSCOUT}/api/v2/addresses/${TOKEN}`);
if (!bsTokenAddr.__error) {
  out.launch.creationTx = bsTokenAddr.creation_transaction_hash ?? bsTokenAddr.creation_tx_hash ?? null;
  out.launch.creator = bsTokenAddr.creator_address_hash ?? null;
  if (out.launch.creationTx) {
    try {
      const r = await rpc("eth_getTransactionReceipt", [out.launch.creationTx]);
      out.launch.blockFromCreationTx = r ? Number(BigInt(r.blockNumber)) : null;
    } catch (e) { out.launch.creationTxError = e.message; }
  }
}

// ---------- 4. Platform /api/coins (launch block as the platform sees it) ----------
out.platform = {};
for (const u of [
  `https://www.stockify.finance/api/coins?address=${TOKEN}`,
  `https://www.stockify.finance/api/coins/${TOKEN}`,
  `https://www.stockify.finance/api/coins`,
]) {
  const j = await getJson(u, { tries: 2 });
  const s = JSON.stringify(j);
  const hit = s.toLowerCase().includes(TOKEN);
  out.platform[u] = { error: j.__error ?? null, bytes: s.length, mentionsToken: hit, sample: hit ? extractAround(s, TOKEN, 1500) : s.slice(0, 400) };
}
function extractAround(s, needle, n) {
  const i = s.toLowerCase().indexOf(needle);
  return s.slice(Math.max(0, i - n / 2), i + n / 2);
}

// ---------- 5. Candidate distributors: who moves what ----------
out.candidates = {};
for (const c of CANDIDATES) {
  const info = {};
  try {
    const code = await rpc("eth_getCode", [c, "latest"]);
    info.isContract = code !== "0x";
    info.codeBytes = (code.length - 2) / 2;
    info.ethBalance = fmtUnits(BigInt(await rpc("eth_getBalance", [c, "latest"])).toString(), 18);
  } catch (e) { info.rpcError = e.message; }
  info.meta = await erc20Meta(c); // in case the index is itself a token
  const a = await getJson(`${BLOCKSCOUT}/api/v2/addresses/${c}`);
  info.blockscout = a.__error ? { error: a.__error } : {
    name: a.name, is_contract: a.is_contract, is_verified: a.is_verified, implementations: a.implementations,
    creator: a.creator_address_hash, creationTx: a.creation_transaction_hash ?? a.creation_tx_hash, token: a.token,
  };

  // ERC-20 flows
  const tt = await blockscoutAll(`/api/v2/addresses/${c}/token-transfers?type=ERC-20`);
  info.tokenTransfers = { fetched: tt.items.length, pages: tt.pages, complete: !!tt.complete, error: tt.error ?? null };
  const flows = {};
  for (const t of tt.items) {
    const tok = (t.token?.address_hash ?? t.token?.address ?? "").toLowerCase();
    const f = (flows[tok] ??= { symbol: t.token?.symbol, name: t.token?.name, decimals: Number(t.token?.decimals ?? t.total?.decimals ?? 18), inRaw: 0n, outRaw: 0n, inCount: 0, outCount: 0, counterparties: {}, first: null, last: null });
    const v = BigInt(t.total?.value ?? "0");
    const from = addr(t.from), to = addr(t.to);
    if (to === c) { f.inRaw += v; f.inCount++; f.counterparties["in:" + from] = (f.counterparties["in:" + from] ?? 0) + 1; }
    if (from === c) { f.outRaw += v; f.outCount++; f.counterparties["out:" + to] = (f.counterparties["out:" + to] ?? 0) + 1; }
    f.first = !f.first || t.timestamp < f.first ? t.timestamp : f.first;
    f.last = !f.last || t.timestamp > f.last ? t.timestamp : f.last;
  }
  info.flows = Object.fromEntries(Object.entries(flows).map(([k, f]) => {
    const top = Object.entries(f.counterparties).sort((a, b) => b[1] - a[1]);
    return [k, {
      symbol: f.symbol, name: f.name, decimals: f.decimals,
      in: fmtUnits(f.inRaw.toString(), f.decimals), out: fmtUnits(f.outRaw.toString(), f.decimals),
      inCount: f.inCount, outCount: f.outCount, bothWays: f.inCount > 0 && f.outCount > 0,
      distinctCounterparties: top.length, topCounterparties: top.slice(0, 8), first: f.first, last: f.last,
    }];
  }));

  // Native ETH: internal txs + normal txs
  const it = await blockscoutAll(`/api/v2/addresses/${c}/internal-transactions`);
  const tx = await blockscoutAll(`/api/v2/addresses/${c}/transactions`);
  let ethIn = 0n, ethOut = 0n, inN = 0, outN = 0;
  const ethInFrom = {}, ethOutTo = {}, methods = {};
  for (const x of [...it.items, ...tx.items]) {
    if (x.success === false || x.status === "error") continue;
    const v = BigInt(x.value ?? "0");
    const from = addr(x.from), to = addr(x.to);
    if (x.method) methods[x.method] = (methods[x.method] ?? 0) + 1;
    if (v === 0n) continue;
    if (to === c) { ethIn += v; inN++; ethInFrom[from] = (ethInFrom[from] ?? 0) + 1; }
    if (from === c) { ethOut += v; outN++; ethOutTo[to] = (ethOutTo[to] ?? 0) + 1; }
  }
  info.eth = {
    internalFetched: it.items.length, internalComplete: !!it.complete, internalError: it.error ?? null,
    txFetched: tx.items.length, txComplete: !!tx.complete, txError: tx.error ?? null,
    in: fmtUnits(ethIn.toString(), 18), out: fmtUnits(ethOut.toString(), 18), inCount: inN, outCount: outN,
    outOverIn: ethIn > 0n ? Number((ethOut * 1_000_000n) / ethIn) / 1_000_000 : null,
    topInFrom: Object.entries(ethInFrom).sort((a, b) => b[1] - a[1]).slice(0, 8),
    topOutTo: Object.entries(ethOutTo).sort((a, b) => b[1] - a[1]).slice(0, 8),
    methods,
  };
  const cnt = await getJson(`${BLOCKSCOUT}/api/v2/addresses/${c}/counters`);
  info.counters = cnt.__error ? { error: cnt.__error } : cnt;
  out.candidates[c] = info;
  await sleep(500);
}

// ---------- 6. Holders (explorer view; treat 0 as "not indexed") ----------
const hc = await getJson(`${BLOCKSCOUT}/api/v2/tokens/${TOKEN}/counters`);
out.holders = { blockscout: hc.__error ? { error: hc.__error } : hc };

// ---------- 7. Stockify index panel (raw) ----------
const html = await fetch(`https://www.stockify.finance/indices/${CANDIDATES[0]}`, { signal: AbortSignal.timeout(20_000) })
  .then(async (r) => ({ status: r.status, text: await r.text() }))
  .catch((e) => ({ status: 0, text: "", error: e.message }));
const text = html.text || "";
out.panel = {
  status: html.status, bytes: text.length, error: html.error ?? null,
  title: text.match(/<title>([^<]*)/)?.[1] ?? null,
  apiPaths: [...new Set(text.match(/\/api\/[a-zA-Z0-9_\-/]+/g) ?? [])].slice(0, 40),
  addresses: [...new Set((text.match(/0x[a-fA-F0-9]{40}/g) ?? []).map((x) => x.toLowerCase()))].slice(0, 60),
  mentionsToken: text.toLowerCase().includes(TOKEN),
  nextData: text.includes("__NEXT_DATA__"),
  scripts: [...new Set(text.match(/\/_next\/static\/[^"']+\.js/g) ?? [])].slice(0, 30),
  visibleSample: text.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 3000),
};

mkdirSync("data", { recursive: true });
writeFileSync("data/discovery.json", JSON.stringify(out, null, 2) + "\n");

// ---------- Summary LAST ----------
log("\n================ DISCOVERY SUMMARY ================");
log("token", TOKEN, "chainId", out.chainId, "latestBlock", out.latestBlock);
log("tokenMeta", JSON.stringify(out.tokenMeta));
log("base pools:", basePairs.length, "| all pools:", pairs.length, out.dexscreener.error ?? "");
for (const p of basePairs.slice(0, 5)) log("  pool", p.pairAddress, p.dexId, p.labels?.join(","), p.quote?.symbol, "mcap", p.marketCap, "liq", p.liquidityUsd, "vol24", p.volume24h, "created", p.pairCreatedAt);
log("quoteMeta", JSON.stringify(out.quoteMeta ?? null));
log("launch", JSON.stringify(out.launch));
log("blockscout token", JSON.stringify(out.blockscoutToken), "holders", JSON.stringify(out.holders));
for (const [c, i] of Object.entries(out.candidates)) {
  log("candidate", c, "contract", i.isContract, "ethBal", i.ethBalance, "bs", JSON.stringify(i.blockscout).slice(0, 300));
  log("  eth", JSON.stringify({ in: i.eth.in, out: i.eth.out, inCount: i.eth.inCount, outCount: i.eth.outCount, outOverIn: i.eth.outOverIn }));
  for (const [t, f] of Object.entries(i.flows)) log("  flow", t, f.symbol, "dec", f.decimals, "in", f.in, `(${f.inCount})`, "out", f.out, `(${f.outCount})`, "both", f.bothWays);
}
log("panel", out.panel.status, out.panel.bytes, "bytes; api paths", out.panel.apiPaths.length, "; mentions token", out.panel.mentionsToken);
log("===================================================");
