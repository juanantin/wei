import "server-only";
import { config } from "./config";
import type { Stats } from "./types";

const REVALIDATE = 60;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url.split("?")[0]}`);
  return res.json() as Promise<T>;
}

// ---------- DexScreener: price, market cap, 24h volume, 24h txns ----------

type DexPair = {
  chainId?: string;
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  txns?: { h24?: { buys: number; sells: number } };
};

async function getMarket() {
  if (!config.tokenAddress) throw new Error("TOKEN_ADDRESS not set");
  // Chain-agnostic lookup: returns every pool for this address across all chains.
  const data = await getJson<{ pairs: DexPair[] | null }>(
    `https://api.dexscreener.com/latest/dex/tokens/${config.tokenAddress}`,
  );
  const pairs = (data.pairs ?? []).filter((p) => !config.dexChain || p.chainId === config.dexChain);
  if (pairs.length === 0) throw new Error("no pairs");

  // Price & market cap from the deepest pool; volume and txns summed across all pools.
  const main = [...pairs].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
  const volume24h = pairs.reduce((s, p) => s + (p.volume?.h24 ?? 0), 0);
  const txns24h = pairs.reduce((s, p) => s + (p.txns?.h24?.buys ?? 0) + (p.txns?.h24?.sells ?? 0), 0);

  return {
    priceUsd: main.priceUsd ? Number(main.priceUsd) : null,
    marketCap: main.marketCap ?? main.fdv ?? null,
    volume24h,
    txns24h,
  };
}

// ---------- Holders ----------

async function getHolders(): Promise<number> {
  if (!config.tokenAddress) throw new Error("TOKEN_ADDRESS not set");

  if (config.holdersProvider === "etherscan") {
    const data = await getJson<{ status: string; result: string }>(
      `https://api.etherscan.io/v2/api?chainid=${config.explorerChainId}&module=token&action=tokenholdercount&contractaddress=${config.tokenAddress}&apikey=${config.etherscanKey}`,
    );
    if (data.status !== "1") throw new Error(`etherscan: ${data.result}`);
    return Number(data.result);
  }

  if (!config.blockscoutUrl) throw new Error("BLOCKSCOUT_URL not set");
  const data = await getJson<{ token_holders_count: string }>(
    `${config.blockscoutUrl}/api/v2/tokens/${config.tokenAddress}/counters`,
  );
  return Number(data.token_holders_count);
}

// ---------- Fee wallet: ETH in (fees collected) / ETH out (distributed) ----------

type EsTx = { from: string; to: string; value: string; isError: string; timeStamp: string };

async function etherscanList(action: "txlist" | "txlistinternal", address: string): Promise<EsTx[]> {
  const data = await getJson<{ status: string; message: string; result: EsTx[] | string }>(
    `https://api.etherscan.io/v2/api?chainid=${config.explorerChainId}&module=account&action=${action}&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${config.etherscanKey}`,
  );
  if (data.status === "1" && Array.isArray(data.result)) return data.result;
  if (data.message === "No transactions found") return [];
  throw new Error(`etherscan ${action}: ${typeof data.result === "string" ? data.result : data.message}`);
}

async function getFees() {
  const fromOverride = (v: string) => (v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
  let fees = fromOverride(config.feesOverride);
  let distributed = fromOverride(config.distributedOverride);
  let lastDistributionAt: number | null = null;

  if ((fees === null || distributed === null) && config.feeWallet && config.etherscanKey) {
    const wallet = config.feeWallet.toLowerCase();
    const [normal, internal] = await Promise.all([
      etherscanList("txlist", wallet),
      etherscanList("txlistinternal", wallet),
    ]);
    let inWei = BigInt(0);
    let outWei = BigInt(0);
    for (const tx of [...normal, ...internal]) {
      if (tx.isError !== "0") continue;
      const v = BigInt(tx.value || "0");
      if (v === BigInt(0)) continue;
      if (tx.to?.toLowerCase() === wallet) inWei += v;
      if (tx.from?.toLowerCase() === wallet) {
        outWei += v;
        lastDistributionAt = Math.max(lastDistributionAt ?? 0, Number(tx.timeStamp) * 1000);
      }
    }
    const toEth = (w: bigint) => Number(w / BigInt(1e12)) / 1e6;
    fees ??= toEth(inWei);
    distributed ??= toEth(outWei);
  }

  if (fees === null && distributed === null) throw new Error("fee wallet not configured");
  return { feesCollectedEth: fees, ethDistributedEth: distributed, lastDistributionAt };
}

// ---------- Aggregate ----------

function settled<T>(r: PromiseSettledResult<T>, label: string): T | null {
  if (r.status === "fulfilled") return r.value;
  console.warn(`[stats] ${label} failed:`, (r.reason as Error)?.message ?? r.reason);
  return null;
}

export async function getStats(): Promise<Stats> {
  const [m, h, f] = await Promise.allSettled([getMarket(), getHolders(), getFees()]);
  const market = settled(m, "market");
  const holders = settled(h, "holders");
  const fees = settled(f, "fees");

  const txns = market?.txns24h ?? null;
  const vitality =
    txns === null ? null : Math.max(0, Math.min(100, (txns / config.vitalityMaxTxns) * 100));

  return {
    priceUsd: market?.priceUsd ?? null,
    marketCap: market?.marketCap ?? null,
    volume24h: market?.volume24h ?? null,
    txns24h: txns,
    vitality,
    holders: holders !== null && Number.isFinite(holders) ? holders : null,
    feesCollectedEth: fees?.feesCollectedEth ?? null,
    ethDistributedEth: fees?.ethDistributedEth ?? null,
    lastDistributionAt: fees?.lastDistributionAt ?? null,
    updatedAt: Date.now(),
  };
}
