import Image from "next/image";
import { Dust } from "./Dust";
import { HeroBadges } from "./Partners";

export function Hero({ incoming, links }: { incoming: number | null; links: { launch: string; index: string } }) {
  return (
    <section id="top" className="relative isolate flex min-h-[640px] items-center overflow-hidden md:min-h-[760px]">
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <Image src="/wei-assets/hero.jpg" alt="" fill priority sizes="100vw" className="anim-kenburns object-cover object-[60%_center] md:object-center" />
      </div>
      <Dust />
      {/* readability gradients */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/80 via-bg/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-bg to-transparent" />

      <div className="container-x absolute inset-x-0 top-6 md:top-8">
        <HeroBadges links={links} />
      </div>

      <div className="container-x pb-24 pt-32 md:pt-36">
        <div className="max-w-[620px]">
          <div
            className="anim-fade flicker label inline-flex items-center gap-2.5 rounded-[3px] border border-ink/15 bg-bg/70 px-3.5 py-2 text-[0.68rem] text-ink/90 backdrop-blur-sm"
            style={{ "--d": "100ms" } as React.CSSProperties}
          >
            <span className="pulse-dot size-1.5 rounded-full bg-[#ff4d3d]" />
            Transmission live
            {incoming !== null && <> · Episode {String(incoming).padStart(2, "0")} incoming</>}
          </div>

          <h1 className="title mt-6 inline-flex flex-col items-center tracking-[-0.02em]">
            <span className="anim-rise block text-[clamp(7.5rem,24vw,17rem)] leading-[0.8]" style={{ "--d": "250ms" } as React.CSSProperties}>
              Wei
            </span>
            <span className="anim-rise -mt-1 block text-[clamp(3.6rem,10.5vw,7.6rem)] leading-[0.9] tracking-[0.01em]" style={{ "--d": "420ms" } as React.CSSProperties}>
              The Dog
            </span>
          </h1>

          <p style={{ "--d": "700ms" } as React.CSSProperties} className="anim-rise mt-8 max-w-[540px] text-lg leading-relaxed text-ink/90 md:text-xl">
            In a near future, a colonist alone on Mars, sending ETH home to his family. A rover that turned hostile. And a dog that
            cannot die, as long as the chain lives.
          </p>

          <div className="anim-rise mt-9 flex flex-wrap gap-3" style={{ "--d": "880ms" } as React.CSSProperties}>
            <a
              href="#episodes"
              className="btn-sheen inline-flex items-center gap-2.5 rounded-[3px] bg-accent px-6 py-3.5 text-[0.95rem] font-semibold text-bg transition hover:brightness-110"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2.5 1.5v9l8-4.5-8-4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              Watch the series
            </a>
            <a
              href="#lore"
              className="inline-flex items-center rounded-[3px] border border-ink/30 bg-bg/40 px-6 py-3.5 text-[0.95rem] font-semibold transition hover:border-ink/60"
            >
              Read the lore
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
