// Chain indexer. Folds three filtered log streams from START_BLOCK forward,
// resuming from data/rewards-state.json (committed, because runners are
// ephemeral):
//   1. WEI  Transfer               → per-wallet balances → holder count
//   2. WETH Transfer  to   INDEX   → fees collected
//   3. WETH Transfer  from INDEX   → paid to holders = every outflow except the
//      protocol's cut (PROTOCOL_RECIPIENT). Outflows are also tallied per
//      non-holder recipient so a new non-holder destination shows up in the log.
// Writes data/rewards.json. Refuses to run while config MISSING is non-empty.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { rpc, sleep, fmtUnits, lastRpcError } from "./lib.mjs";
import { MISSING, TOKEN, TOKEN_DECIMALS, POOL, INDEX, REWARD_TOKEN, REWARD_DECIMALS, PROTOCOL_RECIPIENT, START_BLOCK } from "./config.mjs";

if (MISSING.length) {
  console.error(`Refusing to run: config is missing ${MISSING.join(", ")}. Fill it from the network first.`);
  process.exit(1);
}

const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const pad = (a) => "0x" + a.toLowerCase().replace(/^0x/, "").padStart(64, "0");
const unpad = (t) => "0x" + t.slice(26).toLowerCase();
const ZERO = "0x0000000000000000000000000000000000000000";
const DEAD = "0x000000000000000000000000000000000000dead";
const STATE = "data/rewards-state.json";
const OUT = "data/rewards.json";
const TIME_BUDGET_MS = Number(process.env.TIME_BUDGET_MS || 12 * 60_000);
const MIN_HOLDING_RAW = BigInt(process.env.MIN_HOLDING || "10000") * 10n ** BigInt(TOKEN_DECIMALS); // panel: "Holders under 10,000 coins are skipped"

// ---- state ----
const fresh = {
  cursor: START_BLOCK - 1, feesInRaw: "0", paidOutRaw: "0", otherOutRaw: "0", otherOut: {}, feeTransfers: 0, payoutTransfers: 0,
  rounds: 0, lastRoundTx: null, lastPayoutBlock: null, lastPayoutRaw: "0", lastPayoutHolders: 0,
  lastFeeBlock: null, balances: {}, daily: {},
};
// A present file is trusted, so it must be seeded with the right cursor (START_BLOCK - 1).
const state = existsSync(STATE) ? { ...fresh, ...JSON.parse(readFileSync(STATE, "utf8")) } : fresh;
if (state.cursor < START_BLOCK - 1) {
  console.error(`State cursor ${state.cursor} is before START_BLOCK ${START_BLOCK}; refusing to scan from genesis.`);
  process.exit(1);
}
const bal = new Map(Object.entries(state.balances).map(([k, v]) => [k, BigInt(v)]));
let feesIn = BigInt(state.feesInRaw), paidOut = BigInt(state.paidOutRaw), otherOut = BigInt(state.otherOutRaw);
const otherByRecipient = new Map(Object.entries(state.otherOut).map(([k, v]) => [k, BigInt(v)]));
state.daily ??= {};

// Per-UTC-day buckets (holder payouts exclude the protocol's cut, same as the totals).
const blockTime = new Map();
async function dayOf(blockHex) {
  if (!blockTime.has(blockHex)) {
    const b = await rpc("eth_getBlockByNumber", [blockHex, false]);
    blockTime.set(blockHex, Number(BigInt(b.timestamp)) * 1000);
  }
  return new Date(blockTime.get(blockHex)).toISOString().slice(0, 10);
}
function bump(day, key, v) {
  const d = (state.daily[day] ??= { paidRaw: "0", feesRaw: "0", payments: 0, txs: [] });
  if (key === "paid") { d.paidRaw = (BigInt(d.paidRaw) + v).toString(); d.payments++; }
  if (key === "fees") d.feesRaw = (BigInt(d.feesRaw) + v).toString();
}

async function logs(address, topics, from, to) {
  return rpc("eth_getLogs", [{ address, topics, fromBlock: "0x" + from.toString(16), toBlock: "0x" + to.toString(16) }], 3);
}

const started = Date.now();
const head = Number(BigInt(await rpc("eth_blockNumber", []))) - 5; // stay a few blocks behind the tip
let span = Number(process.env.SPAN || 10_000);
let calls = 0;
let lastRoundTx = state.lastRoundTx;

while (state.cursor < head && Date.now() - started < TIME_BUDGET_MS) {
  const from = state.cursor + 1;
  const to = Math.min(head, from + span - 1);
  let tokenLogs, inLogs, outLogs;
  try {
    tokenLogs = await logs(TOKEN, [TRANSFER], from, to);
    inLogs = await logs(REWARD_TOKEN, [TRANSFER, null, pad(INDEX)], from, to);
    outLogs = await logs(REWARD_TOKEN, [TRANSFER, pad(INDEX)], from, to);
    calls += 3;
  } catch (e) {
    if (span > 500) {
      span = Math.max(500, Math.floor(span / 2));
      console.log(`window ${from}-${to} failed (${e.message.slice(0, 160)}); span -> ${span}`);
      await sleep(2000);
      continue;
    }
    console.log(`giving up this run at ${from}: ${e.message} | last rpc error: ${lastRpcError}`);
    break;
  }

  for (const l of tokenLogs) {
    const f = unpad(l.topics[1]), t = unpad(l.topics[2]), v = BigInt(l.data);
    if (f !== ZERO) bal.set(f, (bal.get(f) ?? 0n) - v);
    bal.set(t, (bal.get(t) ?? 0n) + v);
  }
  for (const l of inLogs) {
    feesIn += BigInt(l.data);
    bump(await dayOf(l.blockNumber), "fees", BigInt(l.data));
    state.feeTransfers++;
    state.lastFeeBlock = Number(BigInt(l.blockNumber));
  }
  for (const l of outLogs) {
    const v = BigInt(l.data);
    const to = unpad(l.topics[2]);
    if (to !== PROTOCOL_RECIPIENT) {
      const day = await dayOf(l.blockNumber);
      bump(day, "paid", v);
      const d = state.daily[day];
      if (!d.txs.includes(l.transactionHash)) d.txs.push(l.transactionHash);
    }
    if (!((bal.get(to) ?? 0n) > 0n) || to === POOL) {
      otherOut += v;
      otherByRecipient.set(to, (otherByRecipient.get(to) ?? 0n) + v);
      continue;
    }
    paidOut += v;
    state.payoutTransfers++;
    if (l.transactionHash !== lastRoundTx) {
      // a new payout round (one multisend tx)
      state.rounds++;
      lastRoundTx = l.transactionHash;
      state.lastPayoutRaw = "0";
      state.lastPayoutHolders = 0;
    }
    state.lastPayoutRaw = (BigInt(state.lastPayoutRaw) + v).toString();
    state.lastPayoutHolders++;
    state.lastPayoutBlock = Number(BigInt(l.blockNumber));
  }

  state.cursor = to;
  if (span < 10_000) span = Math.min(10_000, Math.floor(span * 1.5));
  await sleep(250);
}

state.lastRoundTx = lastRoundTx;
state.feesInRaw = feesIn.toString();
state.paidOutRaw = paidOut.toString();
state.otherOutRaw = otherOut.toString();
state.otherOut = Object.fromEntries([...otherByRecipient].map(([k, v]) => [k, v.toString()]));
state.balances = Object.fromEntries([...bal].filter(([, v]) => v !== 0n).map(([k, v]) => [k, v.toString()]));
mkdirSync("data", { recursive: true });
writeFileSync(STATE, JSON.stringify(state) + "\n");

// ---- published figures ----
const excluded = new Set([ZERO, DEAD, POOL, INDEX, TOKEN]);
const holders = [...bal].filter(([a, v]) => v > 0n && !excluded.has(a));
const synced = state.cursor >= head - 50;
let lastPayoutTime = null;
if (state.lastPayoutBlock) {
  const b = await rpc("eth_getBlockByNumber", ["0x" + state.lastPayoutBlock.toString(16), false]);
  lastPayoutTime = Number(BigInt(b.timestamp)) * 1000;
}
// Wallets that sold after a round's snapshot still received that round, so the
// "holds WEI now" split undercounts holders; only the protocol's cut is excluded.
const protocolOut = otherByRecipient.get(PROTOCOL_RECIPIENT) ?? 0n;
const holderPaid = paidOut + otherOut - protocolOut;
const result = {
  updatedAt: new Date().toISOString(),
  synced,
  cursor: state.cursor,
  head,
  // Holder count is only meaningful once the fold has covered the whole history.
  holders: synced ? holders.length : null,
  holdersAboveMin: synced ? holders.filter(([, v]) => v >= MIN_HOLDING_RAW).length : null,
  feesCollected: Number(fmtUnits(feesIn.toString(), REWARD_DECIMALS)),
  paidToHolders: Number(fmtUnits(holderPaid.toString(), REWARD_DECIMALS)),
  protocolCut: Number(fmtUnits(protocolOut.toString(), REWARD_DECIMALS)),
  // Measured share of fees that reached holders (do not assume the panel's %).
  holderShare: feesIn > 0n ? Number((holderPaid * 1_000_000n) / feesIn) / 1_000_000 : null,
  protocolShare: feesIn > 0n ? Number((protocolOut * 1_000_000n) / feesIn) / 1_000_000 : null,
  otherOut: Number(fmtUnits(otherOut.toString(), REWARD_DECIMALS)),
  otherOutByRecipient: Object.fromEntries(
    [...otherByRecipient].sort((a, b) => (b[1] > a[1] ? 1 : -1)).slice(0, 10).map(([k, v]) => [k, Number(fmtUnits(v.toString(), REWARD_DECIMALS))]),
  ),
  rounds: state.rounds,
  walletPayments: state.payoutTransfers,
  // ETH paid to holders per UTC day (protocol cut excluded). Days fully scanned only once synced.
  daily: Object.fromEntries(
    Object.entries(state.daily).sort().slice(-14).map(([day, d]) => [day, {
      paidToHolders: Number(fmtUnits(d.paidRaw, REWARD_DECIMALS)),
      feesCollected: Number(fmtUnits(d.feesRaw, REWARD_DECIMALS)),
      payments: d.payments,
      payoutTxs: d.txs.length,
    }]),
  ),
  lastPayout: state.lastPayoutBlock
    ? { block: state.lastPayoutBlock, time: lastPayoutTime, amount: Number(fmtUnits(state.lastPayoutRaw, REWARD_DECIMALS)), holders: state.lastPayoutHolders }
    : null,
};
writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");

console.log("\n===== INDEXER =====");
console.log(`calls ${calls}, span ${span}, ${Math.round((Date.now() - started) / 1000)}s`);
console.log(JSON.stringify(result));
