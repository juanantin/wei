// Shared helpers for the data scripts. Node 20+ (global fetch), no dependencies.
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Free public Base endpoints rate-limit or refuse eth_getLogs without warning, so
// rotate through several. A private RPC_URL secret, if set, is always tried first.
export const RPC_URLS = [
  process.env.RPC_URL,
  "https://mainnet.base.org",
  "https://base-rpc.publicnode.com",
  "https://base.llamarpc.com",
  "https://1rpc.io/base",
  "https://base.drpc.org",
].filter(Boolean);
export const RPC_URL = RPC_URLS[0];
let rpcIdx = 0;
export const BLOCKSCOUT = "https://base.blockscout.com";

export async function getJson(url, { tries = 4, init } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) return { __error: `HTTP ${res.status}`, __body: (await res.text()).slice(0, 300) };
      return await res.json();
    } catch (e) {
      last = e;
      await sleep(1000 * 2 ** i);
    }
  }
  return { __error: String(last?.message ?? last) };
}

let rpcId = 0;
export let lastRpcError = null;
export async function rpc(method, params, tries = 5) {
  let last;
  for (let i = 0; i < tries + RPC_URLS.length; i++) {
    const url = RPC_URLS[rpcIdx % RPC_URLS.length];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      if (j.error) throw new Error(`${method}: ${j.error.message}`);
      return j.result;
    } catch (e) {
      last = new Error(`${url.replace(/\/\/([^/]*@)/, "//")} ${e.message}`);
      lastRpcError = last.message;
      // A range-too-large error is about the request, not the endpoint: let the caller shrink it.
      if (method === "eth_getLogs" && /block range|range is too (large|wide)|too many blocks|range.*exceed|exceed.*range|max.*blocks|10000 blocks|query returned more than/i.test(e.message) && !/rate/i.test(e.message)) throw last;
      rpcIdx++; // rotate to the next endpoint
      await sleep(400 * Math.min(8, 2 ** i));
    }
  }
  throw last;
}

// --- minimal ABI encoding/decoding for view calls ---
const SEL = {
  symbol: "0x95d89b41",
  name: "0x06fdde03",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
  owner: "0x8da5cb5b",
};

function decodeString(hex) {
  if (!hex || hex === "0x") return null;
  const h = hex.slice(2);
  if (h.length === 64) {
    // bytes32-style
    return Buffer.from(h, "hex").toString("utf8").replace(/\0+$/, "") || null;
  }
  const len = parseInt(h.slice(64, 128), 16);
  return Buffer.from(h.slice(128, 128 + len * 2), "hex").toString("utf8");
}

export async function call(to, selectorOrData, block = "latest") {
  const data = SEL[selectorOrData] ?? selectorOrData;
  return rpc("eth_call", [{ to, data }, block]);
}

export async function erc20Meta(address) {
  const out = { address };
  for (const k of ["symbol", "name", "decimals", "totalSupply"]) {
    try {
      const r = await call(address, k);
      if (k === "symbol" || k === "name") out[k] = decodeString(r);
      else if (k === "decimals") out[k] = r && r !== "0x" ? Number(BigInt(r)) : null;
      else out[k] = r && r !== "0x" ? BigInt(r).toString() : null;
    } catch (e) {
      out[k] = null;
      out[`${k}Error`] = e.message;
    }
    await sleep(150);
  }
  return out;
}

export async function blockAt(n) {
  return rpc("eth_getBlockByNumber", [typeof n === "number" ? "0x" + n.toString(16) : n, false]);
}

/** First block with timestamp >= ts (unix seconds). */
export async function blockForTimestamp(ts) {
  const latest = await blockAt("latest");
  let hi = Number(BigInt(latest.number));
  const hiTs = Number(BigInt(latest.timestamp));
  // Base: 2s blocks — start from an estimate and widen.
  let lo = Math.max(0, hi - Math.ceil((hiTs - ts) / 2) - 50_000);
  while (lo > 0 && Number(BigInt((await blockAt(lo)).timestamp)) > ts) lo = Math.max(0, lo - 200_000);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const t = Number(BigInt((await blockAt(mid)).timestamp));
    if (t < ts) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export const fmtUnits = (raw, decimals) => {
  if (raw == null || decimals == null) return null;
  const v = BigInt(raw);
  const d = BigInt(10) ** BigInt(decimals);
  const whole = v / d;
  const frac = (v % d).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
};

/** Page through a Blockscout v2 list endpoint. */
export async function blockscoutAll(path, maxPages = 60) {
  const items = [];
  let params = "";
  for (let p = 0; p < maxPages; p++) {
    const sep = path.includes("?") ? "&" : "?";
    const j = await getJson(`${BLOCKSCOUT}${path}${params ? sep + params : ""}`);
    if (j.__error) return { items, error: j.__error, pages: p };
    items.push(...(j.items ?? []));
    if (!j.next_page_params) return { items, pages: p + 1, complete: true };
    params = new URLSearchParams(Object.entries(j.next_page_params).map(([k, v]) => [k, String(v)])).toString();
    await sleep(250);
  }
  return { items, pages: maxPages, complete: false };
}

export const addr = (x) => (x?.hash ?? x?.address_hash ?? x ?? "").toLowerCase();
