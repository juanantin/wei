"use client";

import Image from "next/image";
import { useState } from "react";
import { VideoEmbed } from "./VideoEmbed";

export function FullFilm({ poster, videoUrl, runtime }: { poster: string; videoUrl: string; runtime: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="film" className="border-y border-line bg-panel py-24 md:py-32">
      <div className="container-x">
        <p className="label text-accent">Season one</p>
        <h2 className="title mt-5 text-[clamp(3rem,6.5vw,5.25rem)]">The full film</h2>

        <div className="relative mt-12 aspect-video overflow-hidden rounded-[4px] border border-line bg-black">
          {playing && videoUrl ? (
            <VideoEmbed url={videoUrl} title="WEI THE DOG — The Full Film" />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0"
              aria-label="Play the full film"
            >
              <Image src={poster} alt="" fill sizes="(min-width:1264px) 1216px, 100vw" className="object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-black shadow-lg transition group-hover:scale-110 md:size-24">
                <svg width="22" height="22" viewBox="0 0 12 12" aria-hidden className="ml-1">
                  <path d="M3 1.5v9l7.5-4.5L3 1.5Z" fill="currentColor" />
                </svg>
              </span>
              <span className="absolute bottom-4 left-4 font-mono text-[0.72rem] text-ink md:bottom-6 md:left-6 md:text-sm">
                {playing && !videoUrl ? "Signal incoming" : <>All episodes, one cut · {runtime}</>}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
