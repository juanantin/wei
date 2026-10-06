import "server-only";
import { config } from "./config";
import { agoToMs, parsePanel, visibleText, type PanelFigures } from "./panel";
import type { Stats } from "./types";

const REVALIDATE = 60;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${res.status} ${url.split("?")[0]}`);
  return res.json() as Promise<T>;
}

// ---------- Market: the named pool first, token search only as a fallback ----------

type DexPair = {
  chainId?: string;
  pairAddress?: string;
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  txns?: { h24?: { buys: number; sells: number } };
};

async function getMarket() {
  let pair: DexPair | undefined;
  if (config.pool) {
    const j = await fetchJson<{ pairs?: DexPair[] | null; pair?: DexPair | null }>(
      `https://api.dexscreener.com/latest/dex/pairs/${config.chain}/${config.pool}`,
    ).catch(() => null);
    pair = j?.pair ?? j?.pairs?.[0] ?? undefined;
  }
  if (!pair) {
    const j = await fetchJson<{ pairs: DexPair[] | null }>(`https://api.dexscreener.com/latest/dex/tokens/${config.tokenAddress}`);
    pair = (j.pairs ?? [])
      .filter((p) => p.chainId === config.chain)
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
  }
  if (!pair) throw new Error("no pool");
  const t = pair.txns?.h24;
  return {
    priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
    marketCap: pair.marketCap ?? pair.fdv ?? null,
    volume24h: pair.volume?.h24 ?? null,
    txns24h: t ? t.buys + t.sells : null,
  };
}

// ---------- Rewards: the index's own panel (live), then the committed snapshot ----------

type PanelSnapshot = PanelFigures & { at: string };

async function getPanel(): Promise<{ figures: PanelFigures; at: number }> {
  try {
    const res = await fetch(config.indexUrl, {
      next: { revalidate: REVALIDATE },
      headers: { "user-agent": "Mozilla/5.0 wei-dashboard" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const figures = parsePanel(visibleText(await res.text()));
    if (figures.paidToHolders == null || figures.feesCollected == null) throw new Error("panel parse failed");
    return { figures, at: Date.now() };
  } catch {
    const snap = await fetchJson<PanelSnapshot>(`${config.dataUrl}/panel.json`);
    if (snap.paidToHolders == null || snap.feesCollected == null) throw new Error("snapshot empty");
    return { figures: snap, at: Date.parse(snap.at) };
  }
}

// ---------- Chain indexer output (holders, exact last payout time) ----------

type Rewards = {
  synced: boolean;
  holders: number | null;
  holdersAboveMin: number | null;
  lastPayout: { time: number | null } | null;
};

const getRewards = () => fetchJson<Rewards>(`${config.dataUrl}/rewards.json`);

// ---------- Aggregate ----------

function settled<T>(r: PromiseSettledResult<T>, label: string): T | null {
  if (r.status === "fulfilled") return r.value;
  console.warn(`[stats] ${label} failed:`, (r.reason as Error)?.message ?? r.reason);
  return null;
}

export async function getStats(): Promise<Stats> {
  const [m, p, r] = await Promise.allSettled([getMarket(), getPanel(), getRewards()]);
  const market = settled(m, "market");
  const panel = settled(p, "panel");
  const rewards = settled(r, "rewards");

  const txns = market?.txns24h ?? null;
  const vitality = txns === null ? null : Math.max(0, Math.min(100, (txns / config.vitalityMaxTxns) * 100));

  // A zero holder count means "not indexed yet", never "no holders".
  const holders = rewards?.synced && rewards.holders ? rewards.holders : null;
  const holdersEligible = holders && rewards?.holdersAboveMin ? rewards.holdersAboveMin : null;

  // The chain timestamp is exact, but only once the fold has reached the chain head.
  let lastPayoutAt = rewards?.synced ? (rewards.lastPayout?.time ?? null) : null;
  if (!lastPayoutAt && panel?.figures.lastPayout) {
    const ago = agoToMs(panel.figures.lastPayout.agoValue, panel.figures.lastPayout.agoUnit);
    if (ago != null) lastPayoutAt = panel.at - ago;
  }

  const f = panel?.figures;
  return {
    priceUsd: market?.priceUsd ?? null,
    marketCap: market?.marketCap ?? null,
    volume24h: market?.volume24h ?? null,
    txns24h: txns,
    vitality,
    holders,
    holdersEligible,
    rewardSymbol: f?.rewardSymbol ?? null,
    feesCollected: f?.feesCollected ?? null,
    feesCollectedUsd: f?.feesCollectedUsd ?? null,
    paidToHolders: f?.paidToHolders ?? null,
    paidToHoldersUsd: f?.paidToHoldersUsd ?? null,
    rounds: f?.roundsPaid ?? null,
    lastPayoutAt,
    updatedAt: Date.now(),
  };
}
