"use client";

import Image from "next/image";
import { useStats } from "./StatsProvider";
import { DASH, eth, int, timeAgo, usdCompact, usdPrice } from "@/lib/format";

function Card({
  label,
  value,
  source,
  valueClass = "text-ink",
}: {
  label: string;
  value: React.ReactNode;
  source: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-[4px] border border-line bg-card p-5 md:p-6">
      <p className="label text-[0.66rem] text-muted">{label}</p>
      <p
        className={`mt-4 break-words font-mono text-[clamp(1.5rem,2.6vw,2.15rem)] font-semibold leading-[1.15] ${valueClass}`}
      >
        {value}
      </p>
      <p className="mt-3 font-mono text-[0.7rem] text-muted">{source}</p>
    </div>
  );
}

export function Dashboard({ indexUrl }: { indexUrl?: string }) {
  const { stats } = useStats();
  const s = stats;
  const vitality = s?.vitality ?? null;

  return (
    <section id="dashboard" className="border-y border-line bg-panel py-24 md:py-32">
      <div className="container-x">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label text-accent">Habitat telemetry</p>
            <h2 className="title mt-5 text-[clamp(3rem,6.5vw,5.25rem)]">Mission control</h2>
          </div>
          <p className="flex items-center gap-2 font-mono text-[0.72rem] text-ink/75 md:mb-3">
            <span className="pulse-dot size-1.5 rounded-full bg-ok" />
            Nodes online · live on-chain data
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Card
            label="Market cap"
            value={usdCompact(s?.marketCap)}
            source={<>DexScreener{s?.priceUsd != null && <> · {usdPrice(s.priceUsd)}</>}</>}
          />
          <Card label="24h volume" value={usdCompact(s?.volume24h)} source="DexScreener" />
          <Card
            label="Holders"
            value={int(s?.holders)}
            source={<>Base chain{s?.holdersEligible != null && <> · {int(s.holdersEligible)} earning</>}</>}
          />
          <Card
            label="Fees collected"
            value={s?.feesCollected != null ? <>{eth(s.feesCollected)} {s.rewardSymbol}</> : DASH}
            source={
              <>
                {s?.feesCollectedUsd != null && <>{usdCompact(s.feesCollectedUsd)} · </>}
                {indexUrl ? (
                  <a href={indexUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-ink/30 underline-offset-2 hover:text-accent">
                    Stockify index
                  </a>
                ) : (
                  "Index"
                )}
              </>
            }
          />
          <Card
            label="ETH sent home"
            value={s?.paidToHolders != null ? <>{eth(s.paidToHolders)} {s.rewardSymbol}</> : DASH}
            valueClass="text-glow"
            source={
              <>
                {s?.paidToHoldersUsd != null && <>{usdCompact(s.paidToHoldersUsd)} · </>}
                Paid to holders{s?.rounds != null && <> · {int(s.rounds)} rounds</>}
              </>
            }
          />
          <Card
            label="Last transfer"
            value={s?.lastPayoutAt ? "Confirmed" : DASH}
            valueClass="text-ok text-[clamp(1.1rem,1.6vw,1.35rem)]!"
            source={<>{timeAgo(s?.lastPayoutAt)} · Mars → Earth</>}
          />
        </div>

        <div className="mt-3 flex flex-col gap-5 rounded-[4px] border border-line bg-card p-5 sm:flex-row sm:items-center md:mt-4 md:gap-7 md:p-6">
          <Image
            src="/wei-assets/wei-logo.png"
            alt="Wei"
            width={88}
            height={88}
            className="size-16 shrink-0 rounded-full ring-2 ring-glow ring-offset-2 ring-offset-card md:size-[88px]"
            style={{ boxShadow: `0 0 ${vitality === null ? 0 : 6 + vitality / 4}px rgba(111,168,255,0.55)` }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="label text-[0.66rem] text-glow">
                Wei vitality <span className="ml-2 text-ink/80">{vitality === null ? DASH : `${Math.round(vitality)}%`}</span>
              </p>
              <p className="font-mono text-[0.68rem] text-muted">Powered by every transaction on the chain</p>
            </div>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#1e2a3d]"
              role="progressbar"
              aria-label="Wei vitality"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={vitality === null ? undefined : Math.round(vitality)}
            >
              <div
                className="h-full rounded-full bg-glow shadow-[0_0_12px_rgba(111,168,255,0.7)] transition-[width] duration-1000"
                style={{ width: `${vitality ?? 0}%` }}
              />
            </div>
            <p className="mt-3 text-[0.95rem] text-ink/85">
              As long as the chain lives, Wei lives. The more holders and transactions, the stronger he gets.
              {s?.txns24h != null && <span className="font-mono text-[0.72rem] text-muted"> · {int(s.txns24h)} txns / 24h</span>}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
