"use client";

import { Reveal } from "./Reveal";

import { Decode } from "./Decode";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Episode } from "@/lib/types";
import { useStats } from "./StatsProvider";
import { VideoEmbed } from "./VideoEmbed";

const pad = (n: number) => String(n).padStart(2, "0");

/** Locked if flagged, unless a holder threshold is set and live holders have reached it. */
function isLocked(ep: Episode, holders: number | null) {
  if (!ep.locked) return false;
  if (ep.unlock_at_holders != null && holders != null && holders >= ep.unlock_at_holders) return false;
  return true;
}

function LockedCard({ ep }: { ep: Episode }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[4px] border border-dashed border-ink/15 bg-card/40">
      <div className="relative flex aspect-[16/9] flex-col items-center justify-center gap-3 bg-[repeating-linear-gradient(0deg,rgba(245,233,222,0.025)_0_1px,transparent_1px_4px)]">
        <svg width="22" height="24" viewBox="0 0 22 24" fill="none" aria-hidden className="pulse-dot text-accent/80">
          <rect x="2" y="10" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <span className="label text-[0.66rem] text-ink/70">Signal incoming</span>
      </div>
      <div className="p-5">
        <p className="label text-[0.66rem] text-muted">Ep. {pad(ep.number)}</p>
        <h3 className="title mt-3 text-[2rem] text-[#8a6a58]">Locked</h3>
        <p className="mt-2 text-[0.92rem] text-ink/70">
          Coming soon.
        </p>
      </div>
    </div>
  );
}

function EpisodeCard({ ep, onPlay }: { ep: Episode; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="card-glow group flex w-full flex-col overflow-hidden rounded-[4px] border border-line bg-panel text-left"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={ep.thumbnail}
          alt=""
          fill
          sizes="(min-width:1024px) 300px, (min-width:640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {ep.new && (
          <span className="label absolute left-3 top-3 rounded-[2px] bg-accent px-1.5 py-1 text-[0.58rem] font-semibold text-bg">
            New
          </span>
        )}
        {ep.duration && (
          <span className="absolute bottom-3 left-3 rounded-[3px] bg-black/70 px-2 py-1 font-mono text-[0.7rem] text-ink">
            {ep.duration}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-bg">
            <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden>
              <path d="M3 1.5v9l7.5-4.5L3 1.5Z" fill="currentColor" />
            </svg>
          </span>
        </span>
      </div>
      <div className="p-5">
        <p className="label text-[0.66rem] text-accent">Ep. {pad(ep.number)}</p>
        <h3 className="title mt-3 text-[2rem]">{ep.title}</h3>
        <p className="mt-2 text-[0.92rem] leading-snug text-ink/80">{ep.description}</p>
      </div>
    </button>
  );
}

export function Episodes({ episodes }: { episodes: Episode[] }) {
  const { stats } = useStats();
  const holders = stats?.holders ?? null;
  const [playing, setPlaying] = useState<Episode | null>(null);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPlaying(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [playing]);

  return (
    <section id="episodes" className="py-24 md:py-32">
      <div className="container-x">
        <p className="label text-accent">
              <Decode text="Transmissions from Mars" />
            </p>
        <Reveal>
          <h2 className="title mt-5 text-[clamp(3rem,6.5vw,5.25rem)]">Episodes</h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...episodes]
            .sort((a, b) => a.number - b.number)
            .map((ep, i) => (
              <Reveal key={ep.number} delay={i * 110} className="flex">
                {isLocked(ep, holders) ? (
                  <LockedCard ep={ep} />
                ) : (
                  <EpisodeCard ep={ep} onPlay={() => setPlaying(ep)} />
                )}
              </Reveal>
            ))}
        </div>
      </div>

      {playing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Episode ${playing.number}: ${playing.title}`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setPlaying(null)}
        >
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="label text-[0.7rem] text-ink/80">
                Ep. {pad(playing.number)} · {playing.title}
              </p>
              <button type="button" onClick={() => setPlaying(null)} className="label text-[0.7rem] text-ink/80 hover:text-accent">
                Close ✕
              </button>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-[4px] border border-line bg-black">
              {playing.video_url ? (
                <VideoEmbed url={playing.video_url} title={playing.title} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="label text-ink/70">Signal incoming</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
