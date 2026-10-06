"use client";

import { Reveal } from "./Reveal";

import { Decode } from "./Decode";

import Image from "next/image";
import { useState } from "react";
import { VideoEmbed } from "./VideoEmbed";

/**
 * The full film. If site.json sets film.video_url, that plays; otherwise the
 * released episodes play back to back as one cut.
 */
export function FullFilm({
  poster,
  videoUrl,
  playlist,
  runtime,
}: {
  poster: string;
  videoUrl: string;
  playlist: string[];
  runtime: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [part, setPart] = useState(0);
  const hasVideo = Boolean(videoUrl) || playlist.length > 0;

  return (
    <section id="film" className="border-y border-line bg-panel py-24 md:py-32">
      <div className="container-x">
        <p className="label text-accent">
              <Decode text="Season one" />
            </p>
        <Reveal>
          <h2 className="title mt-5 text-[clamp(3rem,6.5vw,5.25rem)]">The full film</h2>
        </Reveal>

        <Reveal delay={150} className="mt-12">
        <div className="relative aspect-video overflow-hidden rounded-[4px] border border-line bg-black">
          {playing && videoUrl ? (
            <VideoEmbed url={videoUrl} title="WEI THE DOG — The Full Film" />
          ) : playing && playlist.length > 0 ? (
            <video
              key={playlist[part]}
              src={playlist[part]}
              title="WEI THE DOG — The Full Film"
              controls
              autoPlay
              playsInline
              onEnded={() => part + 1 < playlist.length && setPart(part + 1)}
              className="absolute inset-0 size-full bg-black"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0"
              aria-label="Play the full film"
            >
              <Image src={poster} alt="" fill sizes="(min-width:1264px) 1216px, 100vw" className="object-cover transition duration-[1.5s] ease-out group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-black shadow-[0_0_0_0_rgba(232,100,44,0.6)] transition group-hover:scale-110 group-hover:shadow-[0_0_0_14px_rgba(232,100,44,0.15)] md:size-24">
                <svg width="22" height="22" viewBox="0 0 12 12" aria-hidden className="ml-1">
                  <path d="M3 1.5v9l7.5-4.5L3 1.5Z" fill="currentColor" />
                </svg>
              </span>
              <span className="absolute bottom-4 left-4 font-mono text-[0.72rem] text-ink md:bottom-6 md:left-6 md:text-sm">
                {playing && !hasVideo ? "Signal incoming" : <>All episodes, one cut · {runtime}</>}
              </span>
            </button>
          )}
        </div>
        </Reveal>
      </div>
    </section>
  );
}
